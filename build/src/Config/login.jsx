import{Auth,Provider} from "./firebase";
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom"; 
import "./login.css";
export const Login=()=>{
const  navigate=useNavigate();
const signInWithGoogle= async()=>{
const result=signInWithPopup(Auth,Provider)
console.log(result);
navigate("/BookDashboard")
}
    return(
        <div>
            <button onClick ={signInWithGoogle}  > Sign in With Google
            </button>

        </div>
   
    );
};