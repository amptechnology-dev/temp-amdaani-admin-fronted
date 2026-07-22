"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { apiCall } from "../../../../utils/api";
import URL from "../../../../utils/url";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

// Custom Switch with Check/Cross icon inside the thumb
const IconSwitch = ({ checked, onCheckedChange, disabled = false }) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0
        ${checked ? "bg-green-500" : "bg-gray-300"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transform transition-transform duration-200
          ${checked ? "translate-x-5" : "translate-x-0.5"}`}
      >
        {checked ? (
          <Check className="h-3 w-3 text-green-500" strokeWidth={3} />
        ) : (
          <X className="h-3 w-3 text-gray-400" strokeWidth={3} />
        )}
      </span>
    </button>
  );
};

const Plans = () => {
  const [open, setOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const fetchPlans = async () => {
      const res = await apiCall({
        endpoint: URL.plans,
        method: "GET",
      });
      if (res.success) {
        setPlans(res.data);
        console.log(res.data);
      } else if (res == "Unauthorized") {
        Cookies.remove("token");
        toast.success("Session expired. Please log in again.");
        router.push("/login");
      }
    };
    fetchPlans();
  }, []);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    currency: "INR",
    durationDays: 30,
    invoices: "",
    unlimitedInvoices: false,
    features: [{ name: "", available: true, note: "" }],
    isActive: true,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFeatureChange = (index, field, value) => {
    const updatedFeatures = [...form.features];
    updatedFeatures[index][field] = value;
    setForm({ ...form, features: updatedFeatures });
  };

  const addFeature = () => {
    setForm({
      ...form,
      features: [...form.features, { name: "", available: true, note: "" }],
    });
  };

  const handleCardClick = (plan) => {
    setEditMode(true);
    setEditingPlan(plan);

    setForm({
      name: plan.name || "",
      description: plan.description || "",
      price: plan.price?.toString() || "",
      currency: plan.currency || "INR",
      durationDays: plan.durationDays || 30,
      invoices: plan.usageLimits.invoices,
      unlimitedInvoices: plan.usageLimits.unlimited,
      features:
        plan.features?.length > 0
          ? plan.features.map((f) => ({
              name: f.name || "",
              available: f.available !== false,
              note: f.note || "",
            }))
          : [{ name: "", available: true, note: "" }],
      isActive: plan.isActive !== false,
    });

    setOpen(true);
    setTimeout(() => {
      console.log("Editing Plan:", plan);
      console.log("Populated Form:", form);
    }, 3000);
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      currency: "INR",
      durationDays: 30,
      invoices: "",
      unlimitedInvoices: false,
      features: [{ name: "", available: true, note: "" }],
      isActive: true,
    });
    setEditMode(false);
    setEditingPlan(null);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price) {
      toast.error("Please fill in all required fields (Name, Price)");
      return;
    }

    if (!form.unlimitedInvoices && !form.invoices) {
      toast.error("Please fill in Invoices/month or enable Unlimited Invoices");
      return;
    }

    setLoading(true);

    try {
      const requestBody = {
        name: form.name,
        description: form.description,
        price: parseInt(form.price),
        currency: form.currency,
        durationDays: parseInt(form.durationDays),
        usageLimits: {
          invoices: form.unlimitedInvoices ? 0 : parseInt(form.invoices),
          unlimited: form.unlimitedInvoices,
        },
        features: form.features
          .filter((f) => f.name.trim() !== "")
          .map((f) => ({
            name: f.name,
            available: f.available,
            note: f.note,
          })),
        isActive: form.isActive,
      };
      console.log("Request Body:", requestBody);

      const endpoint = editMode
        ? `${URL.plans}/id/${editingPlan._id}`
        : URL.plans;
      const method = editMode ? "PUT" : "POST";

      const res = await apiCall({
        endpoint,
        method,
        body: requestBody,
      });

      console.log("API Response:", res);

      if (res.success) {
        const successMessage = editMode
          ? res.message || "Plan updated successfully!"
          : res.message || "Plan created successfully!";
        toast.success(successMessage);

        if (editMode) {
          setPlans(
            plans.map((plan) =>
              plan._id === editingPlan._id ? res.data : plan
            )
          );
        } else {
          setPlans([...plans, res.data]);
        }

        resetForm();
        setOpen(false);
      } else if (res == "Unauthorized") {
        Cookies.remove("token");
        toast.success("Session expired. Please log in again.");
        router.push("/login");
      } else {
        let errorMessage;
        if (res.status === 401) {
          errorMessage =
            "Unauthorized: Please check your authentication credentials";
        } else if (res.status === 403) {
          errorMessage =
            "Forbidden: You don't have permission to perform this action";
        } else {
          errorMessage = editMode
            ? res.message || "Failed to update plan"
            : res.message || "Failed to create plan";
        }
        toast.error(errorMessage);

        console.error("API Error:", {
          status: res.status,
          message: res.message,
          error: res.error,
          endpoint,
          method,
        });
      }
    } catch (error) {
      console.error(`Error ${editMode ? "updating" : "creating"} plan:`, error);
      toast.error(
        `An error occurred while ${editMode ? "updating" : "creating"} the plan`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Plans Master</h1>
        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          + Add Plan
        </Button>
      </div>

      <ScrollArea className="h-[70vh]">
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan, idx) => (
            <Card
              key={plan._id || idx}
              className="shadow-md cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCardClick(plan)}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {plan.name}
                  <span className="text-sm text-muted-foreground font-normal">
                    Click to edit
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {plan.currency || "INR"} {plan.price} / {plan.durationDays}{" "}
                  days
                </p>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <p className="text-sm mt-2">
                  Invoices:{" "}
                  {plan.usageLimits?.unlimited === true
                    ? "Unlimited"
                    : `${plan.usageLimits?.invoices}/month`}
                </p>
                <ul className="text-sm list-disc pl-5 mt-2">
                  {plan.features?.map((f, i) => (
                    <li
                      key={f._id || i}
                      className={f.available ? "" : "line-through"}
                    >
                      {f.name}
                      {f.note && (
                        <span className="text-muted-foreground">
                          ({f.note})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  Status: {plan.isActive ? "Active" : "Inactive"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Add Plan Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit Plan" : "Add New Plan"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <Label htmlFor="name" className="md:w-40">
                Name *
              </Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <Label htmlFor="description" className="md:w-40">
                Description
              </Label>
              <Input
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
              />
            </div>

            {/* Price */}
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <Label htmlFor="price" className="md:w-40">
                Price *
              </Label>
              <Input
                id="price"
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
              />
            </div>

            {/* Currency */}
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <Label htmlFor="currency" className="md:w-40">
                Currency
              </Label>
              <Input
                id="currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
              />
            </div>

            {/* Duration */}
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <Label htmlFor="durationDays" className="md:w-40">
                Duration (days)
              </Label>
              <Input
                id="durationDays"
                type="number"
                name="durationDays"
                value={form.durationDays}
                onChange={handleChange}
              />
            </div>

            {/* Invoices Section */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <Label htmlFor="invoices" className="md:w-40">
                  Invoices/month *
                </Label>
                <Input
                  id="invoices"
                  type="number"
                  name="invoices"
                  value={form.invoices}
                  onChange={handleChange}
                  disabled={form.unlimitedInvoices}
                  placeholder="Enter number"
                />
              </div>

              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <Label htmlFor="unlimitedInvoices" className="cursor-pointer">
                  Unlimited Invoices
                </Label>
                <IconSwitch
                  checked={form.unlimitedInvoices}
                  onCheckedChange={(val) => {
                    setForm({
                      ...form,
                      unlimitedInvoices: val,
                      invoices: val ? "0" : "",
                    });
                  }}
                />
              </div>
            </div>

            {/* Features Section */}
            <div className="border-t pt-4">
              <Label className="mb-3 block">Features</Label>
              <div className="space-y-2">
                {form.features.map((f, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-2 p-3 border rounded-md bg-gray-50"
                  >
                    <div className="flex flex-col md:flex-row gap-2">
                      <Input
                        placeholder="Feature name"
                        value={f.name}
                        onChange={(e) =>
                          handleFeatureChange(index, "name", e.target.value)
                        }
                        className="flex-1"
                      />
                      <Input
                        placeholder="Note (optional)"
                        value={f.note}
                        onChange={(e) =>
                          handleFeatureChange(index, "note", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Available</span>
                      <IconSwitch
                        checked={f.available}
                        onCheckedChange={(val) =>
                          handleFeatureChange(index, "available", val)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={addFeature}
              >
                + Add Feature
              </Button>
            </div>

            {/* Active Toggle */}
            <div className="border-t pt-4 flex items-center justify-between">
              <Label htmlFor="isActive" className="cursor-pointer">
                Active
              </Label>
              <IconSwitch
                checked={form.isActive}
                onCheckedChange={(val) => setForm({ ...form, isActive: val })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading
                ? editMode
                  ? "Updating..."
                  : "Creating..."
                : editMode
                ? "Update Plan"
                : "Save Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Plans;