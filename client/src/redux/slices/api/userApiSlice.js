import { apiSlice } from "../apiSlice";

const USER_URL = "/user";

export const userApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        updateUser: builder.mutation({
            query: (data) => ({
                url: `${USER_URL}/profile`,
                method: "PUT",
                body: data,
                credentials: "include", // Use "include" to send cookies, if required
            }),
        }),

        register: builder.mutation({
            query: (data) => ({
                url: `${USER_URL}/register`,
                method: "POST",
                body: data,
                credentials: "include", // Use "include" to send cookies, if required
            }),
        }),

        getTeamList: builder.query({
            query: () => ({
                url: `${USER_URL}/get-team`,
                method: "GET",
                credentials: "include", // Use "include" to send cookies, if required
            }),
        }),

        deleteUser: builder.mutation({
            query: (id) => ({
                url: `${USER_URL}/${id}`,
                method: "DELETE",
                credentials: "include", // Use "include" to send cookies, if required
            }),
        }),

        userAction: builder.mutation({
            query: ({ id, data }) => ({
                url: `${USER_URL}/${id}`,   // Correctly pass the ID in the URL.
                method: "PUT",
                body: data,                 // Send only the data (e.g., isActive, role, etc.) in the body.
                credentials: "include",     // Include cookies for authentication, if needed.
            }),
        }),
        
        getNotifications: builder.query({
            query: () => ({
                url: `${USER_URL}/notifications`,
                method: "GET",
                credentials: "include",
            })
        }),

        changePassword: builder.mutation({
            query: (data) => ({
                url: `${USER_URL}/change-password`,
                method: "PUT",
                body: data,
                credentials: "include",
            })
        }),

        markNotiAsRead: builder.mutation({
            query: (data) => ({
                url: `${USER_URL}/read-noti?isReadType=${data.type}&id=${data?.id}`,
                method: "PUT",
                body: data,
                credentials: "include",
            })
        }),

        getUser: builder.mutation({
            query: (id) => ({
                url: `${USER_URL}/get-user?id=${id}`,
                method: "GET",
                credentials: "include",
            })
        })
    }),
});

export const { 
    useUpdateUserMutation, 
    useGetTeamListQuery, 
    useDeleteUserMutation, 
    useUserActionMutation ,
    useGetNotificationsQuery,
    useChangePasswordMutation,
    useMarkNotiAsReadMutation,
    useGetUserMutation
} = userApiSlice;