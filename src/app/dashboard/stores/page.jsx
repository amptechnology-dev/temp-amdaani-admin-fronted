"use client";

import { useState, useEffect } from "react";
import { apiCall } from "../../../../utils/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Filter, Printer, Search } from "lucide-react";
import URL from "../../../../utils/url";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: "all",
    plan: "all",
    status: "all",
    businessType: "all",
  });

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stores, searchTerm, filters]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall({
        endpoint: URL.store,
        method: "GET",
      });

      console.log("Stores API response:", response);

      if (response.success) {
        setStores(response.data || []);
      } else {
        setError("Failed to fetch stores");
      }
    } catch (err) {
      console.error("Error fetching stores:", err);
      setError("Failed to load stores. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Check if subscription is expired
  const isSubscriptionExpired = (subscription) => {
    if (!subscription) return true;
    if (subscription.status === "expired") return true;

    const endDate = new Date(subscription.endDate);
    const today = new Date();
    return endDate < today;
  };

  // Get subscription status with expiration check
  const getSubscriptionStatus = (store) => {
    if (!store.subscription) return "no-plan";

    if (isSubscriptionExpired(store.subscription)) {
      return "expired";
    }

    return store.subscription.status || "active";
  };

  // Get plan name with fallback
  const getPlanName = (store) => {
    if (!store.subscription) return "No Plan";
    if (isSubscriptionExpired(store.subscription)) return "Expired";
    return store.subscription.planName || "Free";
  };

  // Get invoice limits with fallback
  const getInvoiceLimits = (store) => {
    if (!store.subscription || isSubscriptionExpired(store.subscription)) {
      return "0 invoices";
    }

    const limits = store.subscription.baseUsageLimits;
    if (!limits) return "0 invoices";

    return limits.unlimited ? "Unlimited" : `${limits.invoices || 0} invoices`;
  };

  const applyFilters = () => {
    let filtered = [...stores];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (store) =>
          store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          store.tagline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          store.contactNo?.includes(searchTerm) ||
          store.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          store.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      const now = new Date();
      filtered = filtered.filter((store) => {
        const storeDate = new Date(store.createdAt);
        switch (filters.dateRange) {
          case "thisWeek":
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            return storeDate >= startOfWeek;
          case "thisMonth":
            return (
              storeDate.getMonth() === now.getMonth() &&
              storeDate.getFullYear() === now.getFullYear()
            );
          case "thisYear":
            return storeDate.getFullYear() === now.getFullYear();
          case "previousYear":
            return storeDate.getFullYear() === now.getFullYear() - 1;
          case "last5Years":
            return storeDate.getFullYear() >= now.getFullYear() - 5;
          default:
            return true;
        }
      });
    }

    // Plan filter
    if (filters.plan !== "all") {
      filtered = filtered.filter((store) => {
        const planName = getPlanName(store).toLowerCase();
        return planName === filters.plan.toLowerCase();
      });
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((store) => {
        const status = getSubscriptionStatus(store);
        return status === filters.status;
      });
    }

    // Business type filter
    if (filters.businessType !== "all") {
      filtered = filtered.filter(
        (store) =>
          store.type?.toLowerCase() === filters.businessType.toLowerCase()
      );
    }

    // Sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case "alphabetical":
            return a.name?.localeCompare(b.name);
          case "latest":
            return new Date(b.createdAt) - new Date(a.createdAt);
          case "oldest":
            return new Date(a.createdAt) - new Date(b.createdAt);
          case "recentSubscription":
            return (
              new Date(b.subscription?.startDate || 0) -
              new Date(a.subscription?.startDate || 0)
            );
          default:
            return 0;
        }
      });
    }

    setFilteredStores(filtered);
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

  const getStatusBadge = (store) => {
    const status = getSubscriptionStatus(store);

    const statusConfig = {
      active: { variant: "default", label: "Active" },
      inactive: { variant: "secondary", label: "Inactive" },
      expired: { variant: "destructive", label: "Expired" },
      "no-plan": { variant: "outline", label: "No Plan" },
    };

    const config = statusConfig[status] || {
      variant: "secondary",
      label: status,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStoreStaff = (store) => {
    return store.staffInfo || store.staff || null;
  };

  const exportToExcel = () => {
    if (filteredStores.length === 0) {
      alert("No data to export!");
      return;
    }

    const exportData = filteredStores.map((store) => {
      const invoiceUsage = getInvoiceUsage(store);

      return {
        "Store Name": store.name || "-",
        Tagline: store.tagline || "-",
        Type: store.type || "-",
        "Contact No": store.contactNo || "-",
        Email: store.email || "-",
        City: store.address?.city || "-",
        State: store.address?.state || "-",
        Country: store.address?.country || "-",
        Plan: getPlanName(store),
        "Invoices Used": invoiceUsage.used,
        "Total Invoices":
          invoiceUsage.total === Infinity ? "Unlimited" : invoiceUsage.total,
        "Remaining Invoices":
          invoiceUsage.remaining === "Unlimited"
            ? "Unlimited"
            : invoiceUsage.remaining,
        Status: getSubscriptionStatus(store),
        "Created On": formatDate(store.createdAt),
      };
    });

    try {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Stores");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, `stores_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export to Excel. Please try again.");
    }
  };

  const exportToPDF = () => {
    if (filteredStores.length === 0) {
      alert("No data to export!");
      return;
    }

    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(16);
      doc.text("Stores Report", 14, 15);

      // Report date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

      // Summary
      doc.text(`Total Stores: ${filteredStores.length}`, 14, 29);

      const tableColumn = [
        "Store Name",
        "Type",
        "Contact",
        "Location",
        "Plan",
        "Invoices Used",
        "Remaining",
        "Status",
        "Created",
      ];

      const tableRows = filteredStores.map((store) => {
        const invoiceUsage = getInvoiceUsage(store);

        return [
          store.name || "-",
          store.type || "-",
          store.contactNo || "-",
          `${store.address?.city || "-"}, ${store.address?.state || "-"}`,
          getPlanName(store),
          `${invoiceUsage.used} / ${
            invoiceUsage.total === Infinity ? "∞" : invoiceUsage.total
          }`,
          invoiceUsage.remaining === "Unlimited" ? "∞" : invoiceUsage.remaining,
          getSubscriptionStatus(store),
          formatDate(store.createdAt),
        ];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 35 },
      });

      doc.save(`stores_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Failed to export to PDF. Please try again.");
    }
  };

  const printTable = () => {
    window.print();
  };

  const getUniqueValues = (key, subKey = null) => {
    const values = stores
      .map((store) => {
        if (subKey) {
          return store[key]?.[subKey] || null;
        }

        if (key === "subscription" && subKey === "planName") {
          return getPlanName(store);
        }

        return store[key] || null;
      })
      .filter(
        (value) => value !== null && value !== undefined && value !== "No Plan"
      );

    return [...new Set(values)];
  };

  const getUniquePlanNames = () => {
    const plans = stores.map((store) => getPlanName(store));
    return [...new Set(plans)].filter((plan) => plan !== "No Plan");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading stores...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            {error}
            <Button onClick={fetchStores} className="ml-4" variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInvoiceUsage = (store) => {
    if (!store.subscription || isSubscriptionExpired(store.subscription)) {
      return { used: 0, total: 0, remaining: 0 };
    }

    const limits = store.subscription.usageLimits;
    const usage = store.usage;

    const total = limits?.unlimited ? Infinity : limits?.invoices || 0;
    const used = usage?.invoicesUsed || 0;
    const remaining = limits?.unlimited
      ? "Unlimited"
      : Math.max(0, total - used);

    return { used, total, remaining };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stores</CardTitle>
        <CardDescription>
          Manage and view all your stores. Showing: {filteredStores.length} of{" "}
          {stores.length} stores
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stores by name, tagline, contact, email, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Sort By Dropdown */}

            <label className="text-xs font-medium">Sort By</label>
            <Select
              value={filters.sortBy || "alphabetical"}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, sortBy: value }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select sorting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alphabetical">By Alphabets (A–Z)</SelectItem>
                <SelectItem value="latest">By Latest Registration</SelectItem>
                <SelectItem value="oldest">By Oldest Registration</SelectItem>
                <SelectItem value="recentSubscription">
                  By Recent Subscriptions
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Filters Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <div className="p-2 space-y-2">
                  {/* Date Range Filter */}
                  <div>
                    <label className="text-xs font-medium">Date Range</label>
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, dateRange: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="thisWeek">This Week</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                        <SelectItem value="thisYear">This Year</SelectItem>
                        <SelectItem value="previousYear">
                          Previous Year
                        </SelectItem>
                        <SelectItem value="last5Years">Last 5 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Plan Filter */}
                  <div>
                    <label className="text-xs font-medium">Plan</label>
                    <Select
                      value={filters.plan}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, plan: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Plans</SelectItem>
                        {getUniquePlanNames().map((plan) => (
                          <SelectItem key={plan} value={plan.toLowerCase()}>
                            {plan}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="text-xs font-medium">Status</label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="no-plan">No Plan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Business Type Filter */}
                  <div>
                    <label className="text-xs font-medium">Business Type</label>
                    <Select
                      value={filters.businessType}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, businessType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {getUniqueValues("type").map((type) => (
                          <SelectItem key={type} value={type.toLowerCase()}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportToExcel}>
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  Export to PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={printTable}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stores Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Invoices Used</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredStores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No stores found matching your criteria
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStores.map((store) => {
                  const invoiceUsage = getInvoiceUsage(store);
                  const plan = getPlanName(store);
                  const sub = store.subscription || {};
                  const startDate = sub.startDate
                    ? new Date(sub.startDate)
                    : null;
                  const endDate = sub.endDate ? new Date(sub.endDate) : null;
                  const today = new Date();
                  const daysLeft = endDate
                    ? Math.max(
                        0,
                        Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
                      )
                    : 0;

                  return (
                    <TableRow key={store._id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{store.name || "Unnamed Store"}</span>
                          {store.tagline && (
                            <span className="text-xs text-muted-foreground">
                              {store.tagline}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {store.type || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          {store.contactNo && (
                            <span className="text-sm">{store.contactNo}</span>
                          )}
                          {store.email && (
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {store.email}
                            </span>
                          )}
                          {!store.contactNo && !store.email && (
                            <span className="text-xs text-muted-foreground">
                              No contact info
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStoreStaff(store) ? (
                          <div className="flex flex-col space-y-1">
                            <span className="text-sm font-medium">
                              {getStoreStaff(store)?.name || "Unnamed Staff"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {getStoreStaff(store)?.designation || "N/A"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {getStoreStaff(store)?.agentCode || ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Not created by Staff
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm">
                            {store.address?.city || "Unknown"},{" "}
                            {store.address?.state || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {store.address?.country || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm">{plan}</span>
                          <span className="text-xs text-muted-foreground">
                            {getInvoiceLimits(store)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium">
                            {invoiceUsage.used}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            of{" "}
                            {invoiceUsage.total === Infinity
                              ? "Unlimited"
                              : invoiceUsage.total}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-sm font-medium ${
                            invoiceUsage.remaining === 0
                              ? "text-red-500"
                              : invoiceUsage.remaining === "Unlimited"
                              ? "text-green-500"
                              : "text-blue-500"
                          }`}
                        >
                          {invoiceUsage.remaining === "Unlimited"
                            ? "∞"
                            : invoiceUsage.remaining}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(store)}</TableCell>
                      <TableCell>{formatDate(store.createdAt)}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedStore(store)}
                            >
                              Details
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                {selectedStore?.name || "Store Details"}
                              </DialogTitle>
                              <DialogDescription>
                                Full details of this store including
                                subscription and contact info.
                              </DialogDescription>
                            </DialogHeader>

                            {selectedStore && (
                              <div className="space-y-4 mt-4">
                                {/* Basic Info */}
                                <div>
                                  <h4 className="font-semibold">
                                    Business Info
                                  </h4>
                                  <p>Type: {selectedStore.type || "N/A"}</p>
                                  <p>
                                    Tagline: {selectedStore.tagline || "N/A"}
                                  </p>
                                  <p>
                                    GST Number:{" "}
                                    {selectedStore.gstNumber || "N/A"}
                                  </p>
                                  <p>
                                    Registration No:{" "}
                                    {selectedStore.registrationNo || "N/A"}
                                  </p>
                                </div>

                                {/* Contact Info */}
                                <div>
                                  <h4 className="font-semibold">
                                    Contact Info
                                  </h4>
                                  <p>Email: {selectedStore.email || "N/A"}</p>
                                  <p>
                                    Phone: {selectedStore.contactNo || "N/A"}
                                  </p>
                                  <p>
                                    Address:{" "}
                                    {selectedStore.address?.street || ""},{" "}
                                    {selectedStore.address?.city || ""},{" "}
                                    {selectedStore.address?.state || ""},{" "}
                                    {selectedStore.address?.country || ""} -{" "}
                                    {selectedStore.address?.postalCode || ""}
                                  </p>
                                </div>

                                {/* Staff Info */}
                                <div>
                                  <h4 className="font-semibold">Staff Info</h4>
                                  {getStoreStaff(selectedStore) ? (
                                    <>
                                      <p>
                                        Name: {getStoreStaff(selectedStore)?.name || "N/A"}
                                      </p>
                                      <p>
                                        Designation: {getStoreStaff(selectedStore)?.designation || "N/A"}
                                      </p>
                                      <p>
                                        Contact: {getStoreStaff(selectedStore)?.contactNumber || "N/A"}
                                      </p>
                                      <p>
                                        Agent Code: {getStoreStaff(selectedStore)?.agentCode || "N/A"}
                                      </p>
                                    </>
                                  ) : (
                                    <p>No staff assigned</p>
                                  )}
                                </div>

                                {/* Subscription Info */}
                                <div>
                                  <h4 className="font-semibold">
                                    Subscription Info
                                  </h4>
                                  <p>Plan: {plan}</p>
                                  <p>Start Date: {formatDate(sub.startDate)}</p>
                                  <p>End Date: {formatDate(sub.endDate)}</p>
                                  <p>Days Left: {daysLeft} days</p>
                                  <p>
                                    Status:{" "}
                                    {getSubscriptionStatus(selectedStore)}
                                  </p>
                                </div>

                                {/* Usage Info */}
                                <div>
                                  <h4 className="font-semibold">Usage</h4>
                                  <p>
                                    Invoices Used: {invoiceUsage.used} /{" "}
                                    {invoiceUsage.total === Infinity
                                      ? "Unlimited"
                                      : invoiceUsage.total}
                                  </p>
                                  <p>
                                    Remaining:{" "}
                                    {invoiceUsage.remaining === "Unlimited"
                                      ? "∞"
                                      : invoiceUsage.remaining}
                                  </p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
