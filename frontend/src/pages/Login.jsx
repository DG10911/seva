import React from "react";
import AuthForm from "../components/AuthForm";

export default function Login({ onLogin }){ return <AuthForm mode="login" onAuth={onLogin} />; }