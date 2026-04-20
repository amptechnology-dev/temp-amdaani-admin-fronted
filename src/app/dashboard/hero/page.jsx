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
	Zap,
	Shield,
	Rocket,
	Star,
	Sparkles,
	CheckCircle2,
	Clock3,
	Users,
	Lock,
	Heart,
	Bell,
	Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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

const FEATURE_ICON_OPTIONS = [
	{ value: "Zap", label: "Zap", Icon: Zap },
	{ value: "Shield", label: "Shield", Icon: Shield },
	{ value: "Rocket", label: "Rocket", Icon: Rocket },
	{ value: "Star", label: "Star", Icon: Star },
	{ value: "Sparkles", label: "Sparkles", Icon: Sparkles },
	{ value: "CheckCircle2", label: "Check Circle", Icon: CheckCircle2 },
	{ value: "Clock3", label: "Clock", Icon: Clock3 },
	{ value: "Users", label: "Users", Icon: Users },
	{ value: "Lock", label: "Lock", Icon: Lock },
	{ value: "Heart", label: "Heart", Icon: Heart },
	{ value: "Bell", label: "Bell", Icon: Bell },
	{ value: "Globe", label: "Globe", Icon: Globe },
];

const Hero = () => {
	const [heroes, setHeroes] = React.useState([]);
	const [loading, setLoading] = React.useState(false);
	const [open, setOpen] = React.useState(false);
	const [viewMode, setViewMode] = React.useState("grid");
	const [submitting, setSubmitting] = React.useState(false);

	// form fields
	const [editMode, setEditMode] = React.useState(false);
	const [selectedId, setSelectedId] = React.useState(null);
	const [title, setTitle] = React.useState("");
	const [subtitle, setSubtitle] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [gradient, setGradient] = React.useState("");
	const [color1, setColor1] = React.useState("#3b82f6");
	const [color2, setColor2] = React.useState("#8b5cf6");
	const [color3, setColor3] = React.useState("#ec4899");
	const [phoneImage, setPhoneImage] = React.useState(null);
	const [phoneImagePreview, setPhoneImagePreview] = React.useState(null);
	const [features, setFeatures] = React.useState([
		{ icon: "", text: "" },
		{ icon: "", text: "" },
		{ icon: "", text: "" },
	]);
	const [priority, setPriority] = React.useState(1);
	const [isActive, setIsActive] = React.useState(true);

	// -------------------- Fetch All Heroes --------------------
	const fetchHeroes = async () => {
		setLoading(true);
		try {
			const response = await apiCall({
				endpoint: URL.hero,
				method: "GET",
				token: true,
			});

			if (response?.success && Array.isArray(response.data)) {
				setHeroes(response.data);
			} else {
				setHeroes([]);
				toast.error(response?.message || "Failed to fetch heroes.");
			}
		} catch (error) {
			console.log("Error fetching heroes:", error);
			setHeroes([]);
			toast.error("Network Error", {
				description: error.message || "Could not fetch heroes.",
			});
		} finally {
			setLoading(false);
		}
	};

	React.useEffect(() => {
		fetchHeroes();
	}, []);

	// -------------------- Reset Form --------------------
	const resetForm = () => {
		setTitle("");
		setSubtitle("");
		setDescription("");
		setGradient("");
		setPhoneImage(null);
		setFeatures([
			{ icon: "", text: "" },
			{ icon: "", text: "" },
			{ icon: "", text: "" },
		]);
		setPriority(1);
		setIsActive(true);
		setEditMode(false);
		setSelectedId(null);
	};

	const handleFeatureChange = (index, key, value) => {
		setFeatures((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], [key]: value };
			return next;
		});
	};

	// createObjectURL preview for selected file and cleanup
	React.useEffect(() => {
		let objectUrl;
		if (phoneImage && typeof phoneImage !== "string") {
			objectUrl = globalThis.URL.createObjectURL(phoneImage);
			setPhoneImagePreview(objectUrl);
		} else if (typeof phoneImage === "string") {
			setPhoneImagePreview(phoneImage);
		} else {
			setPhoneImagePreview(null);
		}

		return () => {
			if (objectUrl) globalThis.URL.revokeObjectURL(objectUrl);
		};
	}, [phoneImage]);

	// when color pickers change, update gradient as a CSS linear-gradient string
	React.useEffect(() => {
		if (color1 || color2 || color3) {
			setGradient(`linear-gradient(90deg, ${color1}, ${color2}, ${color3})`);
		}
	}, [color1, color2, color3]);

	// -------------------- Get Single Hero (for Edit) --------------------
	const handleEditClick = async (id) => {
		try {
			const response = await apiCall({
				endpoint: `${URL.hero}/${id}`,
				method: "GET",
				token: true,
			});

			if (response.success) {
				const item = response.data;
				setSelectedId(item._id);
				setTitle(item.title || "");
				setSubtitle(item.subtitle || "");
				setDescription(item.description || "");
				setGradient(item.gradient || "");
				setPriority(item.priority ?? 1);
				setIsActive(item.isActive ?? true);
				setPhoneImage(item.phoneImage || null);

				const existingFeatures = Array.isArray(item.features) ? item.features : [];
				setFeatures([
					{
						icon: existingFeatures[0]?.icon || "",
						text: existingFeatures[0]?.text || "",
					},
					{
						icon: existingFeatures[1]?.icon || "",
						text: existingFeatures[1]?.text || "",
					},
					{
						icon: existingFeatures[2]?.icon || "",
						text: existingFeatures[2]?.text || "",
					},
				]);

				setEditMode(true);
				setOpen(true);
			} else {
				toast.error("Failed to load hero details");
			}
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		}
	};

	// -------------------- Create New Hero --------------------
	const handleAddHero = async () => {
		if (!title.trim()) return toast.error("Please enter a title.");
		if (!subtitle.trim()) return toast.error("Please enter subtitle.");
		if (!description.trim()) return toast.error("Please enter description.");
		if (!gradient.trim()) return toast.error("Please enter gradient.");
		if (!phoneImage) return toast.error("Please select phone image.");

		const hasInvalidFeature = features.some(
			(feature) => !feature.icon.trim() || !feature.text.trim()
		);
		if (hasInvalidFeature) {
			return toast.error("Please fill all feature icons and text.");
		}

		setSubmitting(true);
		try {
			const formData = new FormData();
			formData.append("title", title.trim());
			formData.append("subtitle", subtitle.trim());
			formData.append("description", description.trim());
			formData.append("gradient", gradient.trim());
			formData.append("priority", priority);
			features.forEach((feature, index) => {
				formData.append(`features[${index}][icon]`, feature.icon.trim());
				formData.append(`features[${index}][text]`, feature.text.trim());
			});
			formData.append("phoneImage", phoneImage, phoneImage.name);

			const response = await apiCall({
				endpoint: URL.hero,
				method: "POST",
				body: formData,
				token: true,
			});

			if (response.success) {
				await fetchHeroes();
				toast.success("Hero Created Successfully!");
				setOpen(false);
				resetForm();
			} else toast.error(response.message || "Failed to create hero.");
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		} finally {
			setSubmitting(false);
		}
	};

	// -------------------- Update Hero --------------------
	const handleUpdateHero = async () => {
		if (!title.trim()) return toast.error("Please enter a title.");
		if (!subtitle.trim()) return toast.error("Please enter subtitle.");
		if (!description.trim()) return toast.error("Please enter description.");
		if (!gradient.trim()) return toast.error("Please enter gradient.");

		const hasInvalidFeature = features.some(
			(feature) => !feature.icon.trim() || !feature.text.trim()
		);
		if (hasInvalidFeature) {
			return toast.error("Please fill all feature icons and text.");
		}

		setSubmitting(true);
		try {
			const formData = new FormData();
			formData.append("title", title.trim());
			formData.append("subtitle", subtitle.trim());
			formData.append("description", description.trim());
			formData.append("gradient", gradient.trim());
			formData.append("priority", priority);
			formData.append("isActive", isActive);
			formData.append("id", selectedId);
			features.forEach((feature, index) => {
				formData.append(`features[${index}][icon]`, feature.icon.trim());
				formData.append(`features[${index}][text]`, feature.text.trim());
			});

			if (phoneImage && typeof phoneImage !== "string") {
				formData.append("phoneImage", phoneImage);
			}

			const response = await apiCall({
				endpoint: `${URL.hero}/${selectedId}`,
				method: "PUT",
				body: formData,
				token: true,
			});

			if (response.success) {
				toast.success("Hero updated successfully!");
				await fetchHeroes();
				setOpen(false);
				resetForm();
			} else {
				toast.error(response.message || "Failed to update hero.");
			}
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeleteHero = async (id) => {
		const confirmed = window.confirm(
			"Are you sure you want to delete this hero section?"
		);
		if (!confirmed) return;

		setSubmitting(true);
		try {
			const response = await apiCall({
				endpoint: `${URL.hero}/${id}`,
				method: "DELETE",
				token: true,
			});

			if (response?.success) {
				toast.success("Hero deleted successfully!");
				if (selectedId === id) {
					setOpen(false);
					resetForm();
				}
				await fetchHeroes();
			} else {
				toast.error(response?.message || "Failed to delete hero.");
			}
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		} finally {
			setSubmitting(false);
		}
	};

	// -------------------- Form Dialog --------------------
	const HeroFormDialog = () => (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
				<DialogHeader>
					<DialogTitle>{editMode ? "Edit Hero" : "Create New Hero"}</DialogTitle>
					<DialogDescription>
						{editMode
							? "Modify the details of this hero section item."
							: "Fill in the details to create a new hero item."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="title">Title *</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter title"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="subtitle">Subtitle</Label>
						<Input
							id="subtitle"
							value={subtitle}
							onChange={(e) => setSubtitle(e.target.value)}
							placeholder="Enter subtitle"
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="description">Description *</Label>
							<textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Enter description"
								className="w-full rounded-md border px-3 py-2 text-sm resize-vertical min-h-[96px]"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="gradient">Gradient *</Label>
							<Input
								id="gradient"
								value={gradient}
								onChange={(e) => setGradient(e.target.value)}
								placeholder="from-blue-600 via-purple-600 to-pink-600"
							/>

								<div className="mt-2">
									<div
										className={cn("h-12 rounded-md border overflow-hidden", !gradient && "bg-gray-100")}
										style={gradient && gradient.startsWith("linear-gradient") ? { background: gradient } : undefined}
									>
										{!gradient && <div className="h-full w-full" />}
									</div>
									<p className="text-xs text-muted-foreground mt-1">Preview: {gradient ? (gradient.startsWith("linear-gradient") ? "Custom gradient" : gradient) : "—"}</p>

									<div className="flex gap-2 items-center mt-3">
										<div className="flex items-center gap-2">
											<Label className="text-xs">Color 1</Label>
											<input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} className="w-8 h-8 p-0 border rounded" />
										</div>
										<div className="flex items-center gap-2">
											<Label className="text-xs">Color 2</Label>
											<input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} className="w-8 h-8 p-0 border rounded" />
										</div>
										<div className="flex items-center gap-2">
											<Label className="text-xs">Color 3</Label>
											<input type="color" value={color3} onChange={(e) => setColor3(e.target.value)} className="w-8 h-8 p-0 border rounded" />
										</div>
									</div>
								</div>
						</div>
					</div>

					{features.map((feature, index) => (
						<div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2">
							<div className="space-y-2">
								<Label htmlFor={`feature-icon-${index}`}>
									Feature {index + 1} Icon *
								</Label>
								<Select
									value={feature.icon}
									onValueChange={(value) => handleFeatureChange(index, "icon", value)}
								>
									<SelectTrigger id={`feature-icon-${index}`}>
										<SelectValue placeholder="Select icon" />
									</SelectTrigger>
									<SelectContent>
										{feature.icon && !FEATURE_ICON_OPTIONS.some((option) => option.value === feature.icon) && (
											<SelectItem value={feature.icon}>{feature.icon}</SelectItem>
										)}
										{FEATURE_ICON_OPTIONS.map((option) => {
											const Icon = option.Icon;
											return (
												<SelectItem key={option.value} value={option.value}>
													<div className="flex items-center gap-2">
														<Icon className="w-4 h-4" />
														<span>{option.label}</span>
													</div>
												</SelectItem>
											);
										})}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`feature-text-${index}`}>
									Feature {index + 1} Text *
								</Label>
								<Input
									id={`feature-text-${index}`}
									value={feature.text}
									onChange={(e) =>
										handleFeatureChange(index, "text", e.target.value)
									}
									placeholder="Lightning Fast"
								/>
							</div>
						</div>
					))}

					<div className="space-y-2">
						<Label htmlFor="phoneImage">
							Phone Image {editMode ? "(optional)" : "*"}
						</Label>
						<Input
							id="phoneImage"
							type="file"
							accept="image/*"
							onChange={(e) =>
								setPhoneImage(e.target.files ? e.target.files[0] : phoneImage)
							}
						/>

						{phoneImagePreview && (
							<img
								src={phoneImagePreview}
								alt="Hero Preview"
								className="mt-2 w-full h-40 object-cover rounded-md border"
							/>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="priority">Priority</Label>
						<Input
							id="priority"
							type="number"
							min={1}
							value={priority}
							onChange={(e) => setPriority(Number(e.target.value || 1))}
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
						onClick={editMode ? handleUpdateHero : handleAddHero}
						disabled={submitting}
					>
						{submitting ? (
							<>
								<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
								{editMode ? "Updating..." : "Creating..."}
							</>
						) : editMode ? (
							"Update Hero"
						) : (
							"Save Hero"
						)}
					</Button>

					{editMode && (
						<Button
							className="w-full"
							variant="destructive"
							onClick={() => handleDeleteHero(selectedId)}
							disabled={submitting}
						>
							<Trash2 className="w-4 h-4 mr-2" />
							Delete Hero
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);

	// -------------------- Main Render --------------------
	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Hero Master</h1>
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
					<Button variant="outline" onClick={fetchHeroes} disabled={loading}>
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
								Create Hero
							</Button>
						</DialogTrigger>
					</Dialog>
				</div>
			</div>

			{viewMode === "grid" ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{loading ? (
						<div className="col-span-full text-center py-8 text-muted-foreground">Loading heroes...</div>
					) : heroes.length === 0 ? (
						<div className="col-span-full text-center py-8 text-muted-foreground">No hero items found</div>
					) : (
						heroes.map((item) => (
							<div
								key={item._id}
								className="border rounded-lg overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition"
							>
								<img
									src={item.phoneImage}
									alt={item.title}
									className="h-48 w-full object-cover"
								/>
								<div className="p-4 space-y-2">
									<h3 className="font-medium">{item.title}</h3>
									{item.subtitle && <p className="text-sm text-gray-600">{item.subtitle}</p>}
									{item.description && (
										<p className="text-xs text-gray-500">{item.description}</p>
									)}
									<div className="flex items-center gap-2">
										<span className={cn("px-2 py-1 rounded-full text-xs font-medium", item.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>{item.isActive ? "Active" : "Inactive"}</span>
										<span className="text-xs text-gray-500">Priority: {item.priority}</span>
									</div>
									<div className="flex gap-2 pt-2">
										<Button
											size="sm"
											variant="outline"
											onClick={() => handleEditClick(item._id)}
										>
											<Pencil className="h-4 w-4 mr-2" />
											Edit
										</Button>
										<Button
											size="sm"
											variant="destructive"
											onClick={() => handleDeleteHero(item._id)}
										>
											<Trash2 className="h-4 w-4 mr-2" />
											Delete
										</Button>
									</div>
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
								<TableHead>Subtitle</TableHead>
								<TableHead>Description</TableHead>
								<TableHead>Gradient</TableHead>
								<TableHead>Priority</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading heroes...</TableCell>
								</TableRow>
							) : heroes.length === 0 ? (
								<TableRow>
									<TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No hero items found</TableCell>
								</TableRow>
							) : (
								heroes.map((item) => (
									<TableRow key={item._id}>
										<TableCell>
											<img src={item.phoneImage} alt={item.title} className="h-12 w-12 rounded object-cover" />
										</TableCell>
										<TableCell>{item.title}</TableCell>
										<TableCell>{item.subtitle}</TableCell>
										<TableCell>{item.description}</TableCell>
										<TableCell>{item.gradient}</TableCell>
										<TableCell>{item.priority}</TableCell>
										<TableCell>
											<span className={cn("px-2 py-1 rounded-full text-xs font-medium", item.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>{item.isActive ? "Active" : "Inactive"}</span>
										</TableCell>
										<TableCell>
											<Button size="icon" variant="ghost" onClick={() => handleEditClick(item._id)}>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button size="icon" variant="ghost" onClick={() => handleDeleteHero(item._id)}>
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

			{HeroFormDialog()}
		</div>
	);
};

export default Hero;
