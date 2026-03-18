"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  PlusCircle,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiCall } from "../../../../utils/api";
import URL from "../../../../utils/url";
import { toast } from "sonner";

const Ads = () => {
  const [ads, setAds] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState("grid");
  const [submitting, setSubmitting] = React.useState(false);

  // form fields
  const [editMode, setEditMode] = React.useState(false);
  const [selectedAdId, setSelectedAdId] = React.useState(null);
  const [title, setTitle] = React.useState("");
  const [image, setImage] = React.useState(null);
  const [url, setUrl] = React.useState("");
  const [position, setPosition] = React.useState("dashboard");
  const [startDate, setStartDate] = React.useState(undefined);
  const [endDate, setEndDate] = React.useState(undefined);
  const [isActive, setIsActive] = React.useState(true);

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // -------------------- Fetch All Ads --------------------
  const fetchAds = async () => {
    setLoading(true);
    try {
      const response = await apiCall({
        endpoint: URL.ads,
        method: "GET",
        token: true,
      });

      if (response?.success && Array.isArray(response.data)) {
        setAds(response.data);
      } else {
        setAds([]);
        toast.error(response?.message || "Failed to fetch ads.");
      }
    } catch (error) {
      console.log("Error fetching ads:", error);
      setAds([]);
      toast.error("Network Error", {
        description: error.message || "Could not fetch ads.",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAds();
  }, []);

  // -------------------- Reset Form --------------------
  const resetForm = () => {
    setTitle("");
    setImage(null);
    setUrl("");
    setPosition("dashboard");
    setStartDate(undefined);
    setEndDate(undefined);
    setIsActive(true);
    setEditMode(false);
    setSelectedAdId(null);
  };

  // -------------------- Get Single Ad (for Edit) --------------------
  const handleEditClick = async (id) => {
    console.log("🆔 Selected Ad ID:", id);
    try {
      const response = await apiCall({
        endpoint: `${URL.ads}/id/${id}`,
        method: "GET",
        token: true,
      });

      if (response.success) {
        const ad = response.data;
        setSelectedAdId(ad._id);
        setTitle(ad.title || "");
        setUrl(ad.redirectUrl || "");
        setPosition(ad.position || "dashboard");
        setStartDate(new Date(ad.startDate));
        setEndDate(new Date(ad.endDate));
        setIsActive(ad.isActive);
        setImage(ad.imageUrl || null);
        setEditMode(true);
        setOpen(true);
      } else {
        toast.error("Failed to load ad details");
      }
    } catch (error) {
      toast.error("Network Error", { description: error.message });
    }
  };

  // -------------------- Create New Ad --------------------
  const handleAddAd = async () => {
    if (!title.trim()) return toast.error("Please enter an ad title.");
    if (!image) return toast.error("Please select an image.");
    if (!url.trim()) return toast.error("Please enter a redirect URL.");
    if (!position.trim()) return toast.error("Please select a position.");
    if (!startDate) return toast.error("Please select a start date.");
    if (!endDate) return toast.error("Please select an end date.");
    if (endDate <= startDate)
      return toast.error("End date must be after start date.");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("redirectUrl", url.trim());
      formData.append("position", position.trim());
      formData.append("startDate", formatLocalDate(startDate));
      formData.append("endDate", formatLocalDate(endDate));
      formData.append("image", image, image.name);

      console.log("Creating Ad with data:", formData);

      const response = await apiCall({
        endpoint: URL.ads,
        method: "POST",
        body: formData,
        token: true,
      });

      if (response.success) {
        await fetchAds();
        toast.success("Ad Created Successfully!");
        setOpen(false);
        resetForm();
      } else toast.error(response.message || "Failed to create ad.");
    } catch (error) {
      toast.error("Network Error", { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------- Update Ad --------------------
  const handleUpdateAd = async () => {
    if (!title.trim()) return toast.error("Please enter an ad title.");
    if (!position.trim()) return toast.error("Please select a position.");
    if (!startDate) return toast.error("Please select a start date.");
    if (!endDate) return toast.error("Please select an end date.");
    if (endDate <= startDate)
      return toast.error("End date must be after start date.");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("redirectUrl", url.trim());
      formData.append("position", position.trim());
      formData.append("startDate", formatLocalDate(startDate));
      formData.append("endDate", formatLocalDate(endDate));
      formData.append("isActive", isActive);
      formData.append("id", selectedAdId);

      // only append image if it's a File (not string URL)
      if (image && typeof image !== "string") {
        formData.append("image", image);
      }

      const response = await apiCall({
        endpoint: `${URL.ads}/id/${selectedAdId}`,
        method: "PUT",
        body: formData,
        token: true,
      });

      if (response.success) {
        toast.success("Ad updated successfully!");
        await fetchAds();
        setOpen(false);
        resetForm();
      } else {
        toast.error(response.message || "Failed to update ad.");
      }
    } catch (error) {
      toast.error("Network Error", { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------- Format Date --------------------
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch {
      return "Invalid Date";
    }
  };

  // -------------------- Form Dialog --------------------
  const AdFormDialog = () => (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editMode ? "Edit Ad" : "Create New Ad"}</DialogTitle>
          <DialogDescription>
            {editMode
              ? "Modify the details of this advertisement."
              : "Fill in the details to create a new advertisement."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Ad Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter ad title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">
              Upload Image {editMode ? "(optional)" : "*"}
            </Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImage(e.target.files ? e.target.files[0] : image)
              }
            />

            {/* ✅ Add image preview when editing */}
            {editMode && typeof image === "string" && (
              <img
                src={image}
                alt="Ad Preview"
                className="mt-2 w-full h-40 object-cover rounded-md border"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Redirect URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position *</Label>
            <select
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select position</option>
              <option value="dashboard">Dashboard</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  disabled={{ before: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {editMode && (
            <div className="flex items-center gap-2">
              <input
                id="active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          )}

          <Button
            className="w-full"
            onClick={editMode ? handleUpdateAd : handleAddAd}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {editMode ? "Updating..." : "Creating..."}
              </>
            ) : editMode ? (
              "Update Ad"
            ) : (
              "Save Ad"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // -------------------- Main Render --------------------
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ads Master</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={cn(viewMode === "grid" && "bg-gray-200")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("table")}
            className={cn(viewMode === "table" && "bg-gray-200")}
          >
            <TableIcon className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={fetchAds} disabled={loading}>
            <RefreshCw
              className={cn("w-4 h-4 mr-2", loading && "animate-spin")}
            />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setOpen(true);
                }}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Ad
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Loading ads...
            </div>
          ) : ads.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No ads found
            </div>
          ) : (
            ads.map((ad) => (
              <div
                key={ad._id}
                onClick={() => handleEditClick(ad._id)}
                className="border rounded-lg overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition"
              >
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="h-48 w-full object-cover"
                />
                <div className="p-4 space-y-2">
                  <h3 className="font-medium">{ad.title}</h3>
                  <p className="text-xs text-gray-500">
                    {formatDate(ad.startDate)} → {formatDate(ad.endDate)}
                  </p>
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      ad.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    )}
                  >
                    {ad.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Redirect URL</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading ads...
                  </TableCell>
                </TableRow>
              ) : ads.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No ads found
                  </TableCell>
                </TableRow>
              ) : (
                ads.map((ad) => (
                  <TableRow key={ad._id}>
                    <TableCell>
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="h-12 w-12 rounded object-cover"
                      />
                    </TableCell>
                    <TableCell>{ad.title}</TableCell>
                    <TableCell>{ad.redirectUrl}</TableCell>
                    <TableCell>{ad.position}</TableCell>
                    <TableCell>{formatDate(ad.startDate)}</TableCell>
                    <TableCell>{formatDate(ad.endDate)}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          ad.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        )}
                      >
                        {ad.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditClick(ad._id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {AdFormDialog()}
    </div>
  );
};

export default Ads;
