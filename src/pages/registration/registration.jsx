import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { registerUser } from "../../services/registration/registration.axios";
import { toast } from "sonner";

// Zod Schema
const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(16, "Password must be at most 16 characters")
    .regex(/[A-Z]/, "Must contain at least 1 uppercase letter")
    .regex(/[0-9]/, "Must contain at least 1 number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least 1 special character"),
  role: z.enum(["student", "staff"], {
    required_error: "Role is required",
  }),
});

export default function RegistrationPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // ADDED: loading state

  const {
    register,
    handleSubmit,
    setValue,
    reset, // ADDED: reset form
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      role: "",
    },
  });

  // UPDATED: loading + reset form after success
  const onSubmit = async (data) => {
    try {
      setLoading(true); // ADDED

      await registerUser(data);

      toast.success("Registration Successful");
      reset(); // ADDED: clear form
    } catch (error) {
      toast.error(error?.response?.data?.message || "Registration Failed");
    } finally {
      setLoading(false); // ADDED
    }
  };

  return (
    <div className="h-200 flex items-center justify-center ">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Registeration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label>Email</Label>
              <Input
                placeholder="Enter your email"
                {...register("email")}
                className={
                  errors.email
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
              />
              {errors.email && (
                <p className="text-sm text-red-500 text-left">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2 text-left">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password")}
                  className={`pr-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
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

            <div className="space-y-2 text-left">
              <Label>Role</Label>
              <Select onValueChange={(value) => setValue("role", value)}>
                <SelectTrigger
                  className={`w-full ${errors.role ? "border-red-500 focus:ring-red-500" : ""}`}
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500 text-left">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* UPDATED: loader + disabled button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
