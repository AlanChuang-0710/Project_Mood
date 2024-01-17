import { useNavigate, useLocation, useMatches } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentAccessToken } from "@/store/reducer/authSlice";

const ProtectedRoute = ({ children }) => {
    /* 路由權限 */
    // 透過selector抓取accessToken
    const accessToken = useSelector(selectCurrentAccessToken);
    const location = useLocation();
    const nav = useNavigate();
    const matches = useMatches();
    let test = matches.find((item) => item.pathname === location.pathname);
    console.log(test);

    /* 路由守衛 避免沒有token直接進入保護的頁面 */
    if (!accessToken) return nav("/login", { replace: true, state: { from: location } });

    return children;
};

export default ProtectedRoute;