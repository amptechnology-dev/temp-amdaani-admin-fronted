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

const GRADIENT_COLOR_OPTIONS = [
	{ value: "blue-600", label: "Blue 600", hex: "#2563eb" },
	{ value: "purple-600", label: "Purple 600", hex: "#9333ea" },
	{ value: "pink-600", label: "Pink 600", hex: "#db2777" },
	{ value: "red-600", label: "Red 600", hex: "#dc2626" },
	{ value: "orange-600", label: "Orange 600", hex: "#ea580c" },
	{ value: "amber-600", label: "Amber 600", hex: "#d97706" },
	{ value: "yellow-600", label: "Yellow 600", hex: "#ca8a04" },
	{ value: "green-600", label: "Green 600", hex: "#16a34a" },
	{ value: "emerald-600", label: "Emerald 600", hex: "#059669" },
	{ value: "teal-600", label: "Teal 600", hex: "#0d9488" },
	{ value: "cyan-600", label: "Cyan 600", hex: "#0891b2" },
	{ value: "indigo-600", label: "Indigo 600", hex: "#4f46e5" },
	{ value: "rose-600", label: "Rose 600", hex: "#e11d48" },
];

const buildGradientClassString = (from, via, to) =>
	`from-${from} via-${via} to-${to}`;

const parseGradientClassString = (value = "") => {
	const fromMatch = value.match(/from-([a-z]+-\d{3})/i);
	const viaMatch = value.match(/via-([a-z]+-\d{3})/i);
	const toMatch = value.match(/to-([a-z]+-\d{3})/i);

	if (!fromMatch || !viaMatch || !toMatch) return null;

	return {
		from: fromMatch[1],
		via: viaMatch[1],
		to: toMatch[1],
	};
};

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
	const [gradient, setGradient] = React.useState(
		buildGradientClassString("blue-600", "purple-600", "pink-600")
	);
	const [gradientFrom, setGradientFrom] = React.useState("blue-600");
	const [gradientVia, setGradientVia] = React.useState("purple-600");
	const [gradientTo, setGradientTo] = React.useState("pink-600");
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
		setGradient(buildGradientClassString("blue-600", "purple-600", "pink-600"));
		setGradientFrom("blue-600");
		setGradientVia("purple-600");
		setGradientTo("pink-600");
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

	// when gradient color selectors change, update gradient as tailwind class string
	React.useEffect(() => {
		setGradient(buildGradientClassString(gradientFrom, gradientVia, gradientTo));
	}, [gradientFrom, gradientVia, gradientTo]);

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
				const parsedGradient = parseGradientClassString(item.gradient || "");
				if (parsedGradient) {
					setGradientFrom(parsedGradient.from);
					setGradientVia(parsedGradient.via);
					setGradientTo(parsedGradient.to);
					setGradient(item.gradient);
				} else {
					setGradientFrom("blue-600");
					setGradientVia("purple-600");
					setGradientTo("pink-600");
					setGradient(buildGradientClassString("blue-600", "purple-600", "pink-600"));
				}
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

	const handleGradientInputChange = (value) => {
		setGradient(value);
		const parsed = parseGradientClassString(value);
		if (parsed) {
			setGradientFrom(parsed.from);
			setGradientVia(parsed.via);
			setGradientTo(parsed.to);
		}
	};

	const gradientPreviewFromHex =
		GRADIENT_COLOR_OPTIONS.find((item) => item.value === gradientFrom)?.hex ||
		"#2563eb";
	const gradientPreviewViaHex =
		GRADIENT_COLOR_OPTIONS.find((item) => item.value === gradientVia)?.hex ||
		"#9333ea";
	const gradientPreviewToHex =
		GRADIENT_COLOR_OPTIONS.find((item) => item.value === gradientTo)?.hex ||
		"#db2777";

	// -------------------- Form Dialog --------------------
	const HeroFormDialog = () => (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{editMode ? "Edit Hero" : "Create New Hero"}</DialogTitle>
					<DialogDescription>
						{editMode
							? "Modify the details of this hero section item."
							: "Fill in the details to create a new hero item."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
								onChange={(e) => handleGradientInputChange(e.target.value)}
								placeholder="from-blue-600 via-purple-600 to-pink-600"
							/>

								<div className="mt-2">
									<div
										className={cn("h-12 rounded-md border overflow-hidden", !gradient && "bg-gray-100")}
										style={{ background: `linear-gradient(90deg, ${gradientPreviewFromHex}, ${gradientPreviewViaHex}, ${gradientPreviewToHex})` }}
									>
										{!gradient && <div className="h-full w-full" />}
									</div>
									<p className="text-xs text-muted-foreground mt-1">Preview: {gradient || "—"}</p>

									<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
										<div className="space-y-2 rounded-md border p-3">
											<Label className="text-xs font-medium">From</Label>
											<Select value={gradientFrom} onValueChange={setGradientFrom}>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select color" />
												</SelectTrigger>
												<SelectContent>
													{GRADIENT_COLOR_OPTIONS.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															<div className="flex min-w-0 items-center gap-2">
																<span className="h-3 w-3 shrink-0 rounded-full border" style={{ backgroundColor: option.hex }} />
																<span className="truncate">{option.label}</span>
															</div>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-2 rounded-md border p-3">
											<Label className="text-xs font-medium">Via</Label>
											<Select value={gradientVia} onValueChange={setGradientVia}>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select color" />
												</SelectTrigger>
												<SelectContent>
													{GRADIENT_COLOR_OPTIONS.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															<div className="flex min-w-0 items-center gap-2">
																<span className="h-3 w-3 shrink-0 rounded-full border" style={{ backgroundColor: option.hex }} />
																<span className="truncate">{option.label}</span>
															</div>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-2 rounded-md border p-3 sm:col-span-2">
											<Label className="text-xs font-medium">To</Label>
											<Select value={gradientTo} onValueChange={setGradientTo}>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select color" />
												</SelectTrigger>
												<SelectContent>
													{GRADIENT_COLOR_OPTIONS.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															<div className="flex min-w-0 items-center gap-2">
																<span className="h-3 w-3 shrink-0 rounded-full border" style={{ backgroundColor: option.hex }} />
																<span className="truncate">{option.label}</span>
															</div>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
								</div>
						</div>
					</div>

					<div className="space-y-3">
						<h4 className="text-sm font-medium">Hero Features</h4>
						{features.map((feature, index) => (
						<div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
					</div>

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

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
					</div>

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
