import { supabase } from '../utils/index.js';
export const createTask = async (req, res) => {
  try {
    const { userId } = req.user;
    const { title, team, stage, date, priority, assets } = req.body;

    let text = "New task has been assigned to you";

    if (team?.length > 1) {
      text += ` and ${team.length - 1} others.`;
    }

    text += ` The task priority is set to ${priority} priority, so check and act accordingly. The task date is ${new Date(
      date
    ).toDateString()}. Thank you!!!`;

    const activity = {
      type: 'assigned',
      activity: text,
      by: userId,
    };

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        team,
        stage: stage.toLowerCase(),
        date,
        priority: priority.toLowerCase(),
        assets,
        activities: [activity],
      })
      .select('*')
      .single();

    if (error) throw error;

    const { error: noticeError } = await supabase
      .from('notices')
      .insert({
        team,
        text,
        task: task.id,
      });

    if (noticeError) throw noticeError;

    res.status(200).json({ status: true, task, message: 'Task created successfully.' });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const duplicateTask = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    task.id = undefined;

    const { data: newTask, error: newTaskError } = await supabase
      .from('tasks')
      .insert({
        ...task,
        title: `${task.title} - Duplicate`,
      })
      .select('*')
      .single();

    if (newTaskError) throw newTaskError;

    let text = 'New task has been assigned to you';
    if (task.team.length > 1) {
      text += ` and ${task.team.length - 1} others.`;
    }

    text += ` The task priority is set to ${task.priority} priority, so check and act accordingly. The task date is ${new Date(
      task.date
    ).toDateString()}. Thank you!!!`;

    await supabase.from('notices').insert({
      team: task.team,
      text,
      task: newTask.id,
    });

    res.status(200).json({ status: true, message: 'Task duplicated successfully.' });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const postTaskActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { type, activity } = req.body;

    const { data: task, error } = await supabase
      .from('tasks')
      .select('activities')
      .eq('id', id)
      .single();

    if (error) throw error;

    const newActivity = {
      type,
      activity,
      by: userId,
    };

    const updatedActivities = [...task.activities, newActivity];

    await supabase
      .from('tasks')
      .update({ activities: updatedActivities })
      .eq('id', id);

    res.status(200).json({ status: true, message: 'Activity posted successfully.' });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const dashboardStatistics = async (req, res) => {
  try {
    const { userId } = req.user;
    const { data } = await supabase.from('users').select('isAdmin').eq('id', userId).single();
    const isAdmin = data.isAdmin;
    console.log(isAdmin);
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('isTrashed', false);
      
    if(isAdmin == false){
      query = query.contains('team',[userId]);
    }

    const { data: allTasks, error } = await query;
    if (error) throw error;
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('name, title, role, isAdmin, createdAt, isActive')
      .eq('isActive', true)
      .limit(10)
      .order('id', { ascending: false });

    if (userError) throw userError;

    const groupTasks = allTasks.reduce((result, task) => {
      const stage = task.stage;
      result[stage] = (result[stage] || 0) + 1;
      return result;
    }, {});

    const groupData = Object.entries(
      allTasks.reduce((result, task) => {
        result[task.priority] = (result[task.priority] || 0) + 1;
        return result;
      }, {})
    ).map(([name, total]) => ({ name, total }));

    const totalTasks = allTasks.length;
    const last10Tasks = allTasks.slice(0, 10);

    const summary = {
      totalTasks,
      last10Tasks,
      users: isAdmin ? users : [],
      tasks: groupTasks,
      graphData: groupData,
    };

    res.status(200).json({
      status: true,
      message: 'Successfully fetched dashboard statistics',
      ...summary,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};


export const getTasks = async (req, res) => {
  try{
    const {userId} = req.user;
    const { data } = await supabase.from('users').select('isAdmin').eq('id', userId).single();
    const isAdmin = data.isAdmin;
    const { stage, isTrashed } = req.query;

    let queryResult = supabase.from("tasks").select("*").eq('isTrashed', isTrashed);

    if(stage){
      queryResult = queryResult.eq("stage", stage);
    }

    if(!isAdmin){
      queryResult = queryResult.contains('team', [userId]);
    }

    const tasks = await queryResult;

    res.status(200).json({
      status: true,
      tasks,
    });
  }catch (error){
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`*`)
      .eq('id', id)
      .single();

    if (error) throw error;

    res.status(200).json({
      status: true,
      task,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const createSubTask = async (req, res) => {
  try {
    const { title, tag, date } = req.body;
    const { id } = req.params;

    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('subTasks')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const newSubTask = {
      title,
      date,
      tag,
      "completed" : false
    };
    
    // Check if task.subTasks is null or undefined and initialize it to an empty array if it is
    if (!task.subTasks) {
      task.subTasks = [];
    }
    
    console.log(task.subTasks);
    const updatedSubTasks = [...task.subTasks, newSubTask];

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ subTasks: updatedSubTasks })
      .eq('id', id);

    if (updateError) throw updateError;

    res.status(200).json({
      status: true,
      message: "SubTask added successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const completeSubTask = async(req, res) => {
  try{
    const { id } = req.params;
    console.log(req.body);

    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .update({ subTasks: req.body })
      .eq('id', id);

    if (fetchError) throw fetchError;
    res.status(200).json({
      status: true,
      message: "SubTask Updated successfully.",
    });
  }catch(error){
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
}

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, team, stage, priority, assets, submitted } = req.body;
    console.log(req.body);
    // Update the task using Supabase
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        title,
        date,
        priority: priority.toLowerCase(),
        assets,
        stage: stage.toLowerCase(),
        team,
        submitted
      })
      .eq('id', id);

    if (updateError) throw updateError;

    res.status(200).json({
      status: true,
      message: "Task updated successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const trashTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Set the isTrashed flag to true for the task
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ isTrashed: true })
      .eq('id', id);

    if (updateError) throw updateError;

    res.status(200).json({
      status: true,
      message: "Task trashed successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const deleteRestoreTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionType } = req.query;
    console.log(req.query);

    if (actionType === "delete") {
      // Delete the task
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
    } else if (actionType === "deleteAll") {
      // Delete all tasks where isTrashed is true
      const { error: deleteAllError } = await supabase
        .from('tasks')
        .delete()
        .eq('isTrashed', true);

      if (deleteAllError) throw deleteAllError;
    } else if (actionType === "restore") {
      // Restore a specific task
      const { error: restoreError } = await supabase
        .from('tasks')
        .update({ isTrashed: false })
        .eq('id', id);

      if (restoreError) throw restoreError;
    } else if (actionType === "restoreAll") {
      // Restore all trashed tasks
      const { error: restoreAllError } = await supabase
        .from('tasks')
        .update({ isTrashed: false })
        .eq('isTrashed', true);

      if (restoreAllError) throw restoreAllError;
    }

    res.status(200).json({
      status: true,
      message: "Operation performed successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};
