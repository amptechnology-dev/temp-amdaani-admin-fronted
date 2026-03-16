"use client";
import React, { useEffect, useState } from "react";
import { apiCall } from "../../../../utils/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import URL from "../../../../utils/url";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const tagOptions = ["Billing", "Business", "Reports"];

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // ✅ store video being edited

  const [formData, setFormData] = useState({
    title: "",
    youtubeUrl: "",
    description: "",
    tags: [],
    isActive: true,
  });

  // ✅ Fetch videos
  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await apiCall({
        endpoint: URL.videos,
        method: "GET",
      });
      if (res.success) {
        setVideos(res.data);
      } else toast.error(res.message || "Failed to fetch videos");
    } catch (err) {
      toast.error("Error fetching videos");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete video
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    setDeleting(id);
    try {
      const res = await apiCall({
        endpoint: `${URL.videos}/${id}`,
        method: "DELETE",
      });
      if (res.success) {
        toast.success("Video deleted successfully!");
        setVideos((prev) => prev.filter((v) => v._id !== id));
      } else toast.error(res.message || "Failed to delete video");
    } catch (err) {
      toast.error("Error deleting video");
    } finally {
      setDeleting(null);
    }
  };

  // ✅ Add or Update video
  const handleSubmit = async () => {
    const { title, youtubeUrl, description, tags, isActive } = formData;
    if (!title || !youtubeUrl || !description || tags.length === 0) {
      toast.error("Please fill all fields");
      return;
    }

    // const body = JSON.stringify(formData);

    try {
      console.log("Submitting video:", formData);
      const res = editing
        ? await apiCall({
            endpoint: `${URL.videos}/${editing._id}`,
            method: "PUT",
            body: formData,
            token: true,
          })
        : await apiCall({
            endpoint: URL.videos,
            method: "POST",
            body: formData,
            token: true,
          });

      if (res.success) {
        if (editing) {
          toast.success("Video updated successfully!");
          setVideos((prev) =>
            prev.map((v) => (v._id === editing._id ? res.data : v))
          );
        } else {
          toast.success("Video added successfully!");
          setVideos((prev) => [...prev, res.data]);
        }

        setOpen(false);
        setEditing(null);
        setFormData({
          title: "",
          youtubeUrl: "",
          description: "",
          tags: [],
          isActive: true,
        });
      } else toast.error(res.message || "Failed to save video");
    } catch (err) {
      toast.error("Error saving video");
    }
  };

  // ✅ Open Edit dialog with selected video
  const handleEdit = (video) => {
    setEditing(video);
    setFormData({
      title: video.title,
      youtubeUrl: video.youtubeUrl,
      description: video.description,
      tags: video.tags || [],
      isActive: video.isActive,
    });
    setOpen(true);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <>
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-2xl font-semibold">Videos</CardTitle>

        {/* ✅ Add/Edit Video Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditing(null);
                setFormData({
                  title: "",
                  youtubeUrl: "",
                  description: "",
                  tags: [],
                  isActive: true,
                });
              }}
            >
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Video" : "Add New Video"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <Label>Title</Label>
                <Input
                  placeholder="Enter video title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>YouTube URL</Label>
                <Input
                  placeholder="Enter YouTube video link"
                  value={formData.youtubeUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, youtubeUrl: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter video description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Tags</Label>
                <Select
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      tags: formData.tags.includes(value)
                        ? formData.tags.filter((t) => t !== value)
                        : [...formData.tags, value],
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select tags" />
                  </SelectTrigger>
                  <SelectContent>
                    {tagOptions.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ✅ Active Switch */}
              {editing && (
                <div className="flex items-center justify-between mt-2">
                  <Label>Active Status</Label>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleSubmit}>
                {editing ? "Update Video" : "Submit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin h-6 w-6 text-primary" />
          </div>
        ) : videos.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No videos found.</p>
        ) : (
          <Table>
            <TableCaption>A list of all uploaded how-to videos</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[5%] text-center">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Youtube URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video, index) => (
                <TableRow key={video._id}>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell>{video.title}</TableCell>
                  <TableCell>{video.description}</TableCell>
                  <TableCell>
                    {video.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded-md mr-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell>
                    <a
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Watch
                    </a>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm font-medium ${
                        video.isActive ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {video.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(video)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(video._id)}
                      disabled={deleting === video._id}
                    >
                      {deleting === video._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </>
  );
};

export default Videos;
