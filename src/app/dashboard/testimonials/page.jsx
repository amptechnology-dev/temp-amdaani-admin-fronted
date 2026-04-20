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
import {
	PlusCircle,
	RefreshCw,
	LayoutGrid,
	Table as TableIcon,
	Pencil,
	Trash2,
	Quote,
	PlayCircle,
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

const Testimonials = () => {
	const [testimonials, setTestimonials] = React.useState([]);
	const [loading, setLoading] = React.useState(false);
	const [open, setOpen] = React.useState(false);
	const [viewMode, setViewMode] = React.useState("grid");
	const [submitting, setSubmitting] = React.useState(false);

	const [editMode, setEditMode] = React.useState(false);
	const [selectedId, setSelectedId] = React.useState(null);
	const [name, setName] = React.useState("");
	const [designation, setDesignation] = React.useState("");
	const [message, setMessage] = React.useState("");
	const [youtubeLink, setYoutubeLink] = React.useState("");
	const [isActive, setIsActive] = React.useState(true);

	const normalizeYoutubeLink = (value) => {
		const trimmed = value.trim();
		if (!trimmed) return "";
		if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
			return trimmed;
		}
		return `https://${trimmed}`;
	};

	const getYoutubeVideoId = (rawUrl) => {
		const normalized = normalizeYoutubeLink(rawUrl || "");
		if (!normalized) return null;

		try {
			const parsed = new URL(normalized);
			const host = parsed.hostname.toLowerCase();

			if (host.includes("youtu.be")) {
				return parsed.pathname.split("/").filter(Boolean)[0] || null;
			}

			if (host.includes("youtube.com") || host.includes("youtube-nocookie.com")) {
				const fromQuery = parsed.searchParams.get("v");
				if (fromQuery) return fromQuery;

				const parts = parsed.pathname.split("/").filter(Boolean);
				if (parts[0] === "shorts" && parts[1]) return parts[1];
				if (parts[0] === "embed" && parts[1]) return parts[1];
			}
		} catch {
			const fallback = String(rawUrl || "").match(/([a-zA-Z0-9_-]{11})/);
			return fallback ? fallback[1] : null;
		}

		return null;
	};

	const getYoutubeThumbnail = (rawUrl) => {
		const videoId = getYoutubeVideoId(rawUrl);
		if (!videoId) return "";
		return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
	};

	const fetchTestimonials = async () => {
		setLoading(true);
		try {
			const response = await apiCall({
				endpoint: URL.testimonial,
				method: "GET",
				token: true,
			});

			if (response?.success && Array.isArray(response.data)) {
				setTestimonials(response.data);
			} else {
				setTestimonials([]);
				toast.error(response?.message || "Failed to fetch testimonials.");
			}
		} catch (error) {
			console.log("Error fetching testimonials:", error);
			setTestimonials([]);
			toast.error("Network Error", {
				description: error.message || "Could not fetch testimonials.",
			});
		} finally {
			setLoading(false);
		}
	};

	React.useEffect(() => {
		fetchTestimonials();
	}, []);

	const resetForm = () => {
		setName("");
		setDesignation("");
		setMessage("");
		setYoutubeLink("");
		setIsActive(true);
		setEditMode(false);
		setSelectedId(null);
	};

	const fillForm = (item) => {
		setSelectedId(item._id);
		setName(item.name || "");
		setDesignation(item.designation || "");
		setMessage(item.message || "");
		setYoutubeLink(item.youtubeLink || "");
		setIsActive(item.isActive ?? true);
		setEditMode(true);
		setOpen(true);
	};

	const validateForm = () => {
		if (!name.trim()) return "Please enter name.";
		if (!designation.trim()) return "Please enter designation.";
		if (!message.trim()) return "Please enter testimonial message.";
		if (!youtubeLink.trim()) return "Please enter YouTube link.";

		return null;
	};

	const buildPayload = () => ({
		name: name.trim(),
		designation: designation.trim(),
		message: message.trim(),
		youtubeLink: normalizeYoutubeLink(youtubeLink),
		isActive,
	});

	const handleCreate = async () => {
		const validationMessage = validateForm();
		if (validationMessage) return toast.error(validationMessage);

		setSubmitting(true);
		try {
			const response = await apiCall({
				endpoint: URL.testimonial,
				method: "POST",
				body: buildPayload(),
				token: true,
			});

			if (response?.success) {
				await fetchTestimonials();
				toast.success("Testimonial created successfully!");
				setOpen(false);
				resetForm();
			} else {
				toast.error(response?.message || "Failed to create testimonial.");
			}
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		} finally {
			setSubmitting(false);
		}
	};

	const handleUpdate = async () => {
		if (!selectedId) return toast.error("No testimonial selected.");

		const validationMessage = validateForm();
		if (validationMessage) return toast.error(validationMessage);

		setSubmitting(true);
		try {
			let response = await apiCall({
				endpoint: `${URL.testimonial}/${selectedId}`,
				method: "PUT",
				body: buildPayload(),
				token: true,
			});

			if (!response?.success) {
				response = await apiCall({
					endpoint: `${URL.testimonial}/id/${selectedId}`,
					method: "PUT",
					body: buildPayload(),
					token: true,
				});
			}

			if (response?.success) {
				toast.success("Testimonial updated successfully!");
				await fetchTestimonials();
				setOpen(false);
				resetForm();
			} else {
				toast.error(response?.message || "Failed to update testimonial.");
			}
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (id) => {
		const confirmed = window.confirm(
			"Are you sure you want to delete this testimonial?"
		);
		if (!confirmed) return;

		setSubmitting(true);
		try {
			let response = await apiCall({
				endpoint: `${URL.testimonial}/${id}`,
				method: "DELETE",
				token: true,
			});

			if (!response?.success) {
				response = await apiCall({
					endpoint: `${URL.testimonial}/id/${id}`,
					method: "DELETE",
					token: true,
				});
			}

			if (response?.success) {
				toast.success("Testimonial deleted successfully!");
				if (selectedId === id) {
					setOpen(false);
					resetForm();
				}
				await fetchTestimonials();
			} else {
				toast.error(response?.message || "Failed to delete testimonial.");
			}
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		} finally {
			setSubmitting(false);
		}
	};

	const TestimonialFormDialog = () => (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{editMode ? "Edit Testimonial" : "Create New Testimonial"}
					</DialogTitle>
					<DialogDescription>
						{editMode
							? "Modify the details of this testimonial."
							: "Fill in the details to create a new testimonial."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Name *</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Enter name"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="designation">Designation *</Label>
						<Input
							id="designation"
							value={designation}
							onChange={(e) => setDesignation(e.target.value)}
							placeholder="Shop Owner"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="message">Message *</Label>
						<textarea
							id="message"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Amdaani app made my billing system very easy."
							className="w-full rounded-md border px-3 py-2 text-sm resize-vertical min-h-[96px]"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="youtubeLink">YouTube Link *</Label>
						<Input
							id="youtubeLink"
							value={youtubeLink}
							onChange={(e) => setYoutubeLink(e.target.value)}
							placeholder="https://www.youtube.com/watch?v=abcd1234"
						/>
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
						onClick={editMode ? handleUpdate : handleCreate}
						disabled={submitting}
					>
						{submitting ? (
							<>
								<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
								{editMode ? "Updating..." : "Creating..."}
							</>
						) : editMode ? (
							"Update Testimonial"
						) : (
							"Save Testimonial"
						)}
					</Button>

					{editMode && (
						<Button
							className="w-full"
							variant="destructive"
							onClick={() => handleDelete(selectedId)}
							disabled={submitting}
						>
							<Trash2 className="w-4 h-4 mr-2" />
							Delete Testimonial
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Testimonials Master</h1>
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
					<Button variant="outline" onClick={fetchTestimonials} disabled={loading}>
						<RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
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
								Create Testimonial
							</Button>
						</DialogTrigger>
					</Dialog>
				</div>
			</div>

			{viewMode === "grid" ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{loading ? (
						<div className="col-span-full text-center py-8 text-muted-foreground">
							Loading testimonials...
						</div>
					) : testimonials.length === 0 ? (
						<div className="col-span-full text-center py-8 text-muted-foreground">
							No testimonials found
						</div>
					) : (
						testimonials.map((item) => {
							const thumbnail = getYoutubeThumbnail(item.youtubeLink || "");

							return (
							<div
								key={item._id}
								className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
							>
								{thumbnail && (
									<img
										src={thumbnail}
										alt={`${item.name} video thumbnail`}
										className="h-44 w-full object-cover"
									/>
								)}
								<div className="p-4 space-y-3">
									<div className="flex items-start justify-between gap-2">
										<div>
											<h3 className="font-medium">{item.name}</h3>
											<p className="text-sm text-gray-600">{item.designation}</p>
										</div>
										<Quote className="h-4 w-4 text-gray-400" />
									</div>

									<p className="text-sm text-gray-700 line-clamp-3">{item.message}</p>

									<div className="flex items-center justify-between gap-2 pt-1">
										<a
											href={normalizeYoutubeLink(item.youtubeLink || "")}
											target="_blank"
											rel="noreferrer"
											className="inline-flex items-center text-xs text-blue-600 hover:underline"
										>
											<PlayCircle className="h-3.5 w-3.5 mr-1" />
											Watch video
										</a>

										<span
											className={cn(
												"px-2 py-1 rounded-full text-xs font-medium",
												item.isActive
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											)}
										>
											{item.isActive ? "Active" : "Inactive"}
										</span>
									</div>

									<div className="flex gap-2 pt-2">
										<Button
											size="sm"
											variant="outline"
											onClick={() => fillForm(item)}
										>
											<Pencil className="h-4 w-4 mr-2" />
											Edit
										</Button>
										<Button
											size="sm"
											variant="destructive"
											onClick={() => handleDelete(item._id)}
											disabled={submitting}
										>
											<Trash2 className="h-4 w-4 mr-2" />
											Delete
										</Button>
									</div>
								</div>
							</div>
							);
						})
					)}
				</div>
			) : (
				<div className="border rounded-lg">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Designation</TableHead>
								<TableHead>Message</TableHead>
								<TableHead>YouTube Link</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
										Loading testimonials...
									</TableCell>
								</TableRow>
							) : testimonials.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
										No testimonials found
									</TableCell>
								</TableRow>
							) : (
								testimonials.map((item) => (
									<TableRow key={item._id}>
										<TableCell>{item.name}</TableCell>
										<TableCell>{item.designation}</TableCell>
										<TableCell className="max-w-[240px] truncate">{item.message}</TableCell>
										<TableCell className="max-w-[220px] truncate">
											<a
												href={normalizeYoutubeLink(item.youtubeLink || "")}
												target="_blank"
												rel="noreferrer"
												className="text-blue-600 hover:underline"
											>
												{item.youtubeLink}
											</a>
										</TableCell>
										<TableCell>
											<span
												className={cn(
													"px-2 py-1 rounded-full text-xs font-medium",
													item.isActive
														? "bg-green-100 text-green-800"
														: "bg-red-100 text-red-800"
												)}
											>
												{item.isActive ? "Active" : "Inactive"}
											</span>
										</TableCell>
										<TableCell>
											<Button size="icon" variant="ghost" onClick={() => fillForm(item)}>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => handleDelete(item._id)}
												disabled={submitting}
											>
												<Trash2 className="h-4 w-4 text-red-600" />
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			)}

			{TestimonialFormDialog()}
		</div>
	);
};

export default Testimonials;
