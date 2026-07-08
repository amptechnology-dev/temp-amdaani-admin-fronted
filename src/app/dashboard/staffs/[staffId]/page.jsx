"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { apiCall } from "../../../../../utils/api";
import URL from "../../../../../utils/url";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ArrowLeft, RefreshCw, Store, Calendar,Download } from "lucide-react";

const STAFF_API_URL = URL.staff;

const DATE_FILTERS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "thisMonth", label: "This Month" },
  { value: "thisYear", label: "This Year" },
];

export default function StaffDetailsPage() {
  const { staffId } = useParams();
  const router = useRouter();

  const [staff, setStaff] = React.useState(null);
  const [storeList, setStoreList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [dateFilter, setDateFilter] = React.useState("all");
  const [selectedDate, setSelectedDate] = React.useState("");

  // Subscription dialog state (same pattern as staffs page)
  const [subDialogOpen, setSubDialogOpen] = React.useState(false);
  const [subLoading, setSubLoading] = React.useState(false);
  const [subData, setSubData] = React.useState(null);
  const [selectedStoreForSub, setSelectedStoreForSub] = React.useState(null);
  const uniquePlans = React.useMemo(() => {
    const plans = storeList
      .map((s) => s.subscription?.planName)
      .filter(Boolean);
    return [...new Set(plans)];
  }, [storeList]);

  const [planFilter, setPlanFilter] = React.useState("all");

  const fetchStaffStores = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiCall({
        endpoint: `${STAFF_API_URL}/stores/${staffId}`,
        method: "GET",
        token: true,
      });

      if (response?.success && Array.isArray(response?.data?.stores)) {
        setStaff(response.data.staff || null);
        setStoreList(response.data.stores);
      } else {
        toast.error(
          response?.message || "Failed to fetch store registrations.",
        );
      }
    } catch (err) {
      console.error("Error fetching staff stores:", err);
      toast.error("Network Error", {
        description: err.message || "Could not fetch store registrations.",
      });
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  React.useEffect(() => {
    if (staffId) fetchStaffStores();
  }, [staffId, fetchStaffStores]);

  const fetchSubscription = async (store) => {
    setSelectedStoreForSub(store);
    setSubDialogOpen(true);
    setSubLoading(true);
    setSubData(null);
    try {
      const response = await apiCall({
        endpoint: `${URL.subscription}/user-subscription/${store.userId}`,
        method: "GET",
        token: true,
      });

      if (response?.success && response?.data) {
        setSubData(response.data);
      } else {
        toast.error(
          response?.message || "Failed to fetch subscription details.",
        );
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      toast.error("Network Error", {
        description: err.message || "Could not fetch subscription details.",
      });
    } finally {
      setSubLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "active":
      case "success":
        return "bg-emerald-600 hover:bg-emerald-600";
      case "pending":
        return "bg-amber-500 hover:bg-amber-500";
      case "canceled":
      case "failed":
        return "bg-red-600 hover:bg-red-600";
      default:
        return "";
    }
  };

  const isExpired = (subscription) => {
    if (!subscription) return true;
    if (subscription.status === "expired") return true;
    return new Date(subscription.endDate) < new Date();
  };

  const getDaysLeft = (subscription) => {
    if (!subscription?.endDate) return null;
    const end = new Date(subscription.endDate);
    const today = new Date();
    return Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));
  };

  const exportToExcel = () => {
    if (filteredStores.length === 0) {
      toast.error("No data to export!");
      return;
    }

    try {
      const exportData = filteredStores.map((store) => {
        const sub = store.subscription;
        const expired = isExpired(sub);
        const daysLeft = getDaysLeft(sub);

        return {
          "Store Name": store.name || "-",
          Type: store.type || "-",
          "Contact No": store.contactNo || "-",
          City: store.address?.city || "-",
          State: store.address?.state || "-",
          Country: store.address?.country || "-",
          "Registered On": formatDate(store.createdAt),
          "Store Status": store.isActive ? "Active" : "Inactive",
          "Current Plan": sub?.planName || "No Plan",
          "Plan Price": sub ? `₹${sub.price}` : "-",
          "Plan Duration": sub ? `${sub.durationDays} days` : "-",
          "Invoice Limit": sub
            ? sub.baseUsageLimits?.unlimited
              ? "Unlimited"
              : sub.baseUsageLimits?.invoices
            : "-",
          "Plan Start Date": sub ? formatDate(sub.startDate) : "-",
          "Plan End Date": sub ? formatDate(sub.endDate) : "-",
          "Days Left": sub ? (expired ? "Expired" : daysLeft) : "-",
          "Subscription Status": sub
            ? expired
              ? "Expired"
              : sub.status
            : "No Plan",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Store Registrations");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const staffName = staff?.name?.replace(/\s+/g, "_") || "staff";
      saveAs(
        blob,
        `${staffName}_stores_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );

      toast.success("Excel file downloaded successfully.");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export to Excel. Please try again.");
    }
  };

  const filteredStores = React.useMemo(() => {
    let result = storeList;

    if (planFilter !== "all") {
      result = result.filter(
        (store) => store.subscription?.planName === planFilter,
      );
    }

    if (dateFilter === "all") return result;

    const now = new Date();

    // ✅ specific date picked via calendar input
    if (dateFilter === "specificDay" && selectedDate) {
      const picked = new Date(selectedDate);
      return result.filter((store) => {
        if (!store.createdAt) return false;
        const created = new Date(store.createdAt);
        return (
          created.getDate() === picked.getDate() &&
          created.getMonth() === picked.getMonth() &&
          created.getFullYear() === picked.getFullYear()
        );
      });
    }

    return result.filter((store) => {
      if (!store.createdAt) return false;
      const created = new Date(store.createdAt);

      switch (dateFilter) {
        case "today":
          return (
            created.getDate() === now.getDate() &&
            created.getMonth() === now.getMonth() &&
            created.getFullYear() === now.getFullYear()
          );
        case "yesterday": {
          // ✅ new
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          return (
            created.getDate() === yesterday.getDate() &&
            created.getMonth() === yesterday.getMonth() &&
            created.getFullYear() === yesterday.getFullYear()
          );
        }
        case "thisMonth":
          return (
            created.getMonth() === now.getMonth() &&
            created.getFullYear() === now.getFullYear()
          );
        case "thisYear":
          return created.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }, [storeList, dateFilter, planFilter, selectedDate]);

  const SubscriptionDialog = () => {
    const currentPlan = subData?.currentPlan;
    const previousPlan = subData?.previousPlan;
    const payments = subData?.payments || [];

    return (
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0">
          <div className="flex max-h-[85vh] flex-col">
            <div className="border-b px-6 py-5">
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle>Subscription Details</DialogTitle>
                <DialogDescription>
                  {selectedStoreForSub?.name || "Store"} — subscription &
                  payment history
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-6">
              {subLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Loading subscription...
                </div>
              ) : !subData ? (
                <div className="py-10 text-center text-muted-foreground">
                  No subscription data found.
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Current Plan
                    </h4>
                    {currentPlan ? (
                      <div className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold">
                            {currentPlan.planName}
                          </span>
                          <Badge
                            className={getStatusBadgeClass(currentPlan.status)}
                          >
                            {currentPlan.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <span>
                            Price: ₹{currentPlan.price} /{" "}
                            {currentPlan.durationDays} days
                          </span>
                          <span>
                            Invoices:{" "}
                            {currentPlan.usageLimits?.unlimited
                              ? "Unlimited"
                              : currentPlan.usageLimits?.invoices}
                          </span>
                          <span>
                            Start: {formatDate(currentPlan.startDate)}
                          </span>
                          <span>End: {formatDate(currentPlan.endDate)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No active plan.
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Previous Plan
                    </h4>
                    {previousPlan ? (
                      <div className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {previousPlan.planName}
                          </span>
                          <Badge
                            variant="secondary"
                            className={getStatusBadgeClass(previousPlan.status)}
                          >
                            {previousPlan.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <span>
                            Price: ₹{previousPlan.price} /{" "}
                            {previousPlan.durationDays} days
                          </span>
                          <span>
                            Invoices:{" "}
                            {previousPlan.usageLimits?.unlimited
                              ? "Unlimited"
                              : previousPlan.usageLimits?.invoices}
                          </span>
                          <span>
                            Start: {formatDate(previousPlan.startDate)}
                          </span>
                          <span>End: {formatDate(previousPlan.endDate)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No previous plan.
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Payment History
                    </h4>
                    {payments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No payments found.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {payments.map((payment) => (
                          <div
                            key={payment._id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                ₹{payment.amount} · {payment.method}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(
                                  payment.paidAt || payment.createdAt,
                                )}{" "}
                                · {payment.transactionId}
                              </p>
                            </div>
                            <Badge
                              className={getStatusBadgeClass(payment.status)}
                            >
                              {payment.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading staff details...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-start gap-3">
            <Button size="icon" variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-1">
              <CardTitle className="text-2xl">
                {staff?.name || "Staff"}
              </CardTitle>
              <CardDescription>
                {staff?.designation} · {staff?.agentCode} ·{" "}
                {staff?.contactNumber}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Showing {filteredStores.length} of {storeList.length} stores
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />

              {DATE_FILTERS.map((f) => (
                <Button
                  key={f.value}
                  size="sm"
                  variant={dateFilter === f.value ? "default" : "outline"}
                  onClick={() => {
                    setDateFilter(f.value);
                    setSelectedDate("");
                  }}
                >
                  {f.label}
                </Button>
              ))}

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateFilter(e.target.value ? "specificDay" : "all");
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />

              {/* ✅ Export to Excel button */}
              <Button size="sm" variant="outline" onClick={exportToExcel}>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>

          {filteredStores.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              No stores found for this filter.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStores.map((store) => {
                const sub = store.subscription;
                const expired = isExpired(sub);
                const daysLeft = getDaysLeft(sub);

                return (
                  <div key={store._id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {store.name || "Unnamed Store"}
                      </p>
                      <Badge
                        variant={store.isActive ? "default" : "secondary"}
                        className={cn(
                          store.isActive &&
                            "bg-emerald-600 hover:bg-emerald-600",
                        )}
                      >
                        {store.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {store.type || "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {store.contactNo || "N/A"}
                    </p>
                    {store.address && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[
                          store.address.street,
                          store.address.city,
                          store.address.state,
                          store.address.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Registered: {formatDate(store.createdAt)}
                    </p>

                    {/* ✅ Current Plan section */}
                    <div className="mt-3 rounded-md border bg-muted/30 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Current Plan
                        </span>
                        {sub && (
                          <Badge
                            className={getStatusBadgeClass(
                              expired ? "expired" : sub.status,
                            )}
                          >
                            {expired ? "Expired" : sub.status}
                          </Badge>
                        )}
                      </div>

                      {sub ? (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-semibold">
                            {sub.planName}{" "}
                            <span className="font-normal text-muted-foreground">
                              · ₹{sub.price}/{sub.durationDays}d
                            </span>
                          </p>
                          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                            <span>
                              Invoices:{" "}
                              {sub.baseUsageLimits?.unlimited
                                ? "Unlimited"
                                : sub.baseUsageLimits?.invoices}
                            </span>
                            <span>
                              {expired ? "Ended" : `${daysLeft} days left`}
                            </span>
                            <span>Start: {formatDate(sub.startDate)}</span>
                            <span>End: {formatDate(sub.endDate)}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground">
                          No plan assigned.
                        </p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full"
                      onClick={() => fetchSubscription(store)}
                    >
                      View Full Subscription History
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {SubscriptionDialog()}
    </div>
  );
}
