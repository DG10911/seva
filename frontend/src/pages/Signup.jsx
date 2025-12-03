import React from "react";
import AuthForm from "../components/AuthForm";

export default function Signup({ onSignup }){ return <AuthForm mode="signup" onAuth={onSignup} />; }