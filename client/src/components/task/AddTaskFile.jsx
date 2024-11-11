import { useSelector } from "react-redux";
import { useState } from "react";
import { BiImages } from "react-icons/bi";
import ModalWrapper from "../ModalWrapper";
import { Dialog } from "@headlessui/react";
import Button from "../Button";
import { useUpdateTaskMutation } from "../../redux/slices/api/taskApiSlice";
import { toast } from "sonner";
import { supabase } from "../../utils/supabase";

const AddTaskFile = ({ open, setOpen, task }) => {
    const { user } = useSelector((state) => state.auth);
    const [uploading, setUploading] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploadedURLs, setUploadedURLs] = useState(task?.submitted ? [...task.submitted] : []);
    const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

    const handleSelect = (e) => {
        setFiles(e.target.files);
    };

    const uploadFile = async (file) => {
        try {
            const fileName = `${new Date().getTime()}-${user.name}-${file.name}`;
            const filePath = `${task.id}/${fileName}`;

            const { data, error: uploadError } = await supabase.storage
                .from('tms')
                .upload(filePath, file);

            if (uploadError) {
                console.error("Upload error occurred:", uploadError.message);
                throw uploadError;
            }

            const publicURL = `https://zcjgzorykylqmpktillg.supabase.co/storage/v1/object/public/tms/${filePath}`;

            setUploadedURLs(prevURLs => [...prevURLs, publicURL]);
        } catch (error) {
            console.error('Failed to upload file:', error.message);
            throw error;
        }
    };

    const handleOnSubmit = async (event) => {
        event.preventDefault();
        try {
            for (const file of files) {
                setUploading(true);
                try {
                  await uploadFile(file);
                } catch (error) { 
                  console.error("Error uploading file:", error.message);
                  setUploading(false);
                  toast.error("Failed to upload file: " + error.message);
                  return;
                } finally {
                  setUploading(false);
                }
              }
          
              try{
                const submitted = {
                    url: uploadedURLs,
                    by: user.id,
                }
                const newData= {
                    title: task.title,
                    date: task.date,
                    priority: task.priority,
                    assets: task.assets,
                    stage: task.stage,
                    team: task.team,
                    submitted: [submitted],
                }
          
                const res = await updateTask({...newData, id: task.id}).unwrap()
          
                toast.success(res.message);
          
                setTimeout(() => {
                  setOpen(false);
                  window.location.reload();
                }, 500);
            } catch (error) {
                console.error("Error during file upload or task update:", error.message);
                toast.error("Failed to process: " + error.message);
            } finally {
                setUploading(false);
            } 
        }catch (error){
            console.log(error);
            toast.error(error?.data?.message || error.error);
        }
    };

    return (
        <ModalWrapper open={open} setOpen={setOpen}>
            <form onSubmit={handleOnSubmit} className=''>
                <Dialog.Title as='h2' className='text-base font-bold leading-6 text-gray-900 mb-4'>
                    UPLOAD FILE
                </Dialog.Title>
                <label className='flex items-center gap-1 text-base text-ascent-2 hover:text-ascent-1 cursor-pointer my-4' htmlFor='imgUpload'>
                    <input type='file' className='hidden' id='imgUpload' onChange={handleSelect} accept='*' multiple={true} />
                    <BiImages />
                    <span>Add Files</span>
                </label>
                <div className='py-3 mt-4 flex sm:flex-row-reverse gap-4'>
                    <Button type='submit' className='bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 sm:ml-3 sm:w-auto' label='Add File' />
                    <Button type='button' className='bg-white border text-sm font-semibold text-gray-900 sm:w-auto' onClick={() => setOpen(false)} label='Cancel' />
                </div>
            </form>
        </ModalWrapper>
    );
};

export default AddTaskFile;
