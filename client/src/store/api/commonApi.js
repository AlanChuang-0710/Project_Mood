import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/dist/query/react";
import { setCredentials, logout } from "../reducer/authSlice";

//指定查詢的基礎信息，發信請求的工具
const baseQuery = fetchBaseQuery({
    baseUrl: "http://127.0.0.1:3000/common",
    credentials: "include", // 即便跨域也會攜帶上cookie
    mode: 'cors',
    timeout: 10000,
    // 統一修改請求頭 參數包括(headers && redux store倉庫)
    prepareHeaders: (headers, { getState }) => {
        const accessToken = getState().auth.accessToken;
        if (accessToken) {
            headers.set("accessToken", accessToken);
        }
        return headers;
    }
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);
    if (result?.data?.data?.message === "jwt expired") {
        const refreshResult = await fetchBaseQuery({ baseUrl: "http://127.0.0.1:3000", credentials: "include", mode: 'cors' })('/users/refresh', api, extraOptions);
        if (refreshResult?.data?.data?.accessToken) {
            const authData = api.getState().auth;
            api.dispatch(setCredentials({ ...authData, accessToken: refreshResult.data.data.accessToken })); // store new token
            result = await baseQuery(args, api, extraOptions); // retry original query with new access token
        } else {
            api.dispatch(logout());
        }
    }
    return result;
};

const commonApi = createApi({

    //Api的標示，不能跟其他Api或是reducer重複
    reducerPath: "common",

    //指定查詢的基礎信息，發信請求的工具
    baseQuery: baseQueryWithReauth,

    tagTypes: ["getCommonData"], //用來指定Api中的標籤類型

    endpoints(build) {
        //build是請求的構建器，通過build來設置請求的相關信息
        return {
            getCommonEssayData: build.query({
                query({ id }) {
                    return {
                        url: `/${id}/essay`,
                        method: "get",
                    };
                },
                keepUnusedDataFor: 0, // 設置數據緩存的時間，單位為秒，默認60s
                providesTags: [{
                    type: "getCommonData",
                }]
            }),

        };
    }
});


// 自動生成的鉤子函數的命名規則 getStudents ---> useGetStudentsQuery (use表示鉤子函數 Query表示查詢)
export const { useGetCommonEssayDataQuery } = commonApi;
export default commonApi;