import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "./login.schema";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Eye, EyeOff, Loader2 } from "lucide-react";

// ADDED: import Link for navigation
import { Link } from "react-router-dom";
import { loginUser } from "../../services/LoginAuth/loginAuth.axios";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const response = await loginUser(data);

      const { message, token, role } = response;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      toast.success(message);

      if (role === "staff") {
        navigate("/staffDashboard");
      } else if (role === "student") {
        navigate("/studentDashboard");
      }
      reset();
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Invalid credentials");
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" closeButton richColors /> {/* REQUIRED */}
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Login</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* EMAIL */}
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  {...register("email")}
                  placeholder="Enter your email"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 text-left">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="space-y-1">
                <Label>Password</Label>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="Enter your password"
                    className={
                      errors.password ? "border-red-500 pr-10" : "pr-10"
                    }
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {errors.password && (
                  <p className="text-sm text-red-500 text-left">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* SUBMIT */}
              <Button
                type="submit"
                className="w-full flex items-center gap-2"
                disabled={loading}
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                Login
              </Button>

              {/* ADDED: Registration Link */}
              <p className="text-center text-sm mt-2">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Register here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
