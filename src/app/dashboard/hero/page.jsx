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

const Hero = () => {
	const [heroes, setHeroes] = React.useState([]);
	const [loading, setLoading] = React.useState(false);
	const [open, setOpen] = React.useState(false);
	const [viewMode, setViewMode] = React.useState("grid");
	const [submitting, setSubmitting] = React.useState(false);

	// form fields
	const [editMode, setEditMode] = React.useState(false);
	const [selectedId, setSelectedId] = React.useState(null);
	const [phoneImage, setPhoneImage] = React.useState(null);
	const [phoneImagePreview, setPhoneImagePreview] = React.useState(null);
	const [heroButtons, setHeroButtons] = React.useState([]);
	const [heroButtonLoading, setHeroButtonLoading] = React.useState(false);
	const [heroButtonSubmitting, setHeroButtonSubmitting] = React.useState(false);
	const [heroButtonId, setHeroButtonId] = React.useState("");
	const [heroButtonName, setHeroButtonName] = React.useState("");
	const [heroButtonLink, setHeroButtonLink] = React.useState("");
	const [heroButtonActive, setHeroButtonActive] = React.useState(true);

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
		fetchHeroButtons();
	}, []);

	const fetchHeroButtons = async () => {
		setHeroButtonLoading(true);
		try {
			const response = await apiCall({
				endpoint: URL.heroButton,
				method: "GET",
				token: true,
			});

			if (response?.success && Array.isArray(response.data)) {
				setHeroButtons(response.data);
				if (response.data.length > 0 && !heroButtonId) {
					const firstButton = response.data[0];
					setHeroButtonId(firstButton._id || "");
					setHeroButtonName(firstButton.name || "");
					setHeroButtonLink(firstButton.link || "");
					setHeroButtonActive(firstButton.isActive ?? true);
				}
			} else {
				setHeroButtons([]);
				toast.error(response?.message || "Failed to fetch hero buttons.");
			}
		} catch (error) {
			setHeroButtons([]);
			toast.error("Network Error", {
				description: error.message || "Could not fetch hero buttons.",
			});
		} finally {
			setHeroButtonLoading(false);
		}
	};

	// -------------------- Reset Form --------------------
	const resetForm = () => {
		setPhoneImage(null);
		setPhoneImagePreview(null);
		setEditMode(false);
		setSelectedId(null);
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
				setPhoneImage(item.phoneImage || null);
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
		if (!phoneImage) return toast.error("Please select an image.");

		setSubmitting(true);
		try {
			const formData = new FormData();
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
		setSubmitting(true);
		try {
			const formData = new FormData();
			formData.append("id", selectedId);

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

	const handleEditHeroButton = async (id) => {
		try {
			const response = await apiCall({
				endpoint: `${URL.heroButton}/${id}`,
				method: "GET",
				token: true,
			});

			if (response?.success && response?.data) {
				setHeroButtonId(response.data._id || "");
				setHeroButtonName(response.data.name || "");
				setHeroButtonLink(response.data.link || "");
				setHeroButtonActive(response.data.isActive ?? true);
			} else {
				toast.error(response?.message || "Failed to load hero button details.");
			}
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		}
	};

	const handleCreateHeroButton = async () => {
		if (!heroButtonName.trim()) return toast.error("Please enter button name.");
		if (!heroButtonLink.trim()) return toast.error("Please enter button link.");

		setHeroButtonSubmitting(true);
		try {
			const response = await apiCall({
				endpoint: URL.heroButton,
				method: "POST",
				body: {
					name: heroButtonName.trim(),
					link: heroButtonLink.trim(),
				},
				token: true,
			});

			if (response?.success) {
				toast.success("Hero button created successfully!");
				await fetchHeroButtons();
				setHeroButtonName("");
				setHeroButtonLink("");
				setHeroButtonId("");
				setHeroButtonActive(true);
			} else {
				toast.error(response?.message || "Failed to create hero button.");
			}
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		} finally {
			setHeroButtonSubmitting(false);
		}
	};

	const handleUpdateHeroButton = async () => {
		if (!heroButtonId) return toast.error("No hero button found to update.");
		if (!heroButtonName.trim()) return toast.error("Please enter button name.");
		if (!heroButtonLink.trim()) return toast.error("Please enter button link.");

		setHeroButtonSubmitting(true);
		try {
			const response = await apiCall({
				endpoint: `${URL.heroButton}/${heroButtonId}`,
				method: "PUT",
				body: {
					name: heroButtonName.trim(),
					link: heroButtonLink.trim(),
				},
				token: true,
			});

			if (response?.success) {
				toast.success("Hero button updated successfully!");
				await fetchHeroButtons();
			} else {
				toast.error(response?.message || "Failed to update hero button.");
			}
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		} finally {
			setHeroButtonSubmitting(false);
		}
	};

	const handleDeleteHeroButton = async (id) => {
		const confirmed = window.confirm(
			"Are you sure you want to delete this hero button?"
		);
		if (!confirmed) return;

		setHeroButtonSubmitting(true);
		try {
			const response = await apiCall({
				endpoint: `${URL.heroButton}/${id}`,
				method: "DELETE",
				token: true,
			});

			if (response?.success) {
				toast.success("Hero button deleted successfully!");
				if (heroButtonId === id) {
					setHeroButtonId("");
					setHeroButtonName("");
					setHeroButtonLink("");
					setHeroButtonActive(true);
				}
				await fetchHeroButtons();
			} else {
				toast.error(response?.message || "Failed to delete hero button.");
			}
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		} finally {
			setHeroButtonSubmitting(false);
		}
	};

	const handleToggleHeroButton = async (id) => {
		setHeroButtonSubmitting(true);
		try {
			const response = await apiCall({
				endpoint: `${URL.heroButton}/toggle/${id}`,
				method: "PATCH",
				token: true,
			});

			if (response?.success) {
				toast.success(response?.message || "Hero button status updated.");
				await fetchHeroButtons();
				if (heroButtonId === id) {
					await handleEditHeroButton(id);
				}
			} else {
				toast.error(response?.message || "Failed to toggle hero button status.");
			}
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		} finally {
			setHeroButtonSubmitting(false);
		}
	};



	// -------------------- Form Dialog --------------------
	const HeroFormDialog = () => (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="w-[95vw] max-w-md">
				<DialogHeader>
					<DialogTitle>{editMode ? "Edit Hero" : "Create New Hero"}</DialogTitle>
					<DialogDescription>
						Upload a banner image for the hero section.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="phoneImage">
							Banner Image {editMode ? "(optional)" : "*"}
						</Label>
						<Input
							id="phoneImage"
							type="file"
							accept="image/*"
							onChange={async (e) => {
								const file = e.target.files ? e.target.files[0] : null;

								if (!file) return;
									setPhoneImage(file);
							}}
						/>
						<p className="text-xs text-muted-foreground">
								Only images with a size of 1920 × 800 (12:5 ratio) are allowed. Please upload images in this format.
						</p>

						{phoneImagePreview && (
							<img
								src={phoneImagePreview}
								alt="Hero Preview"
								className="mt-2 w-full h-40 object-cover rounded-md border"
							/>
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

			<div className="rounded-lg border p-4 space-y-4">
				<div className="flex items-center justify-between gap-2">
					<h2 className="text-lg font-semibold">Hero Button Settings</h2>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							onClick={() => {
								setHeroButtonId("");
								setHeroButtonName("");
								setHeroButtonLink("");
								setHeroButtonActive(true);
							}}
						>
							New
						</Button>
						<Button
							variant="outline"
							onClick={fetchHeroButtons}
							disabled={heroButtonLoading}
						>
							<RefreshCw className={cn("w-4 h-4 mr-2", heroButtonLoading && "animate-spin")} />
							Refresh
						</Button>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="heroButtonName">Button Name</Label>
						<Input
							id="heroButtonName"
							value={heroButtonName}
							onChange={(e) => setHeroButtonName(e.target.value)}
							placeholder="Download v1.0.4"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="heroButtonLink">Button Link</Label>
						<Input
							id="heroButtonLink"
							value={heroButtonLink}
							onChange={(e) => setHeroButtonLink(e.target.value)}
							placeholder="https://play.google.com/store/apps/details?id=com.amdaani.app"
						/>
					</div>
				</div>

				<div className="flex flex-wrap gap-2">
					{heroButtons.map((item) => (
						<Button
							key={item._id}
							variant={heroButtonId === item._id ? "default" : "outline"}
							onClick={() => handleEditHeroButton(item._id)}
						>
							{item.name || "Hero Button"}
						</Button>
					))}
				</div>

				<div className="rounded-md border overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Link</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{heroButtonLoading ? (
								<TableRow>
									<TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
										Loading hero buttons...
									</TableCell>
								</TableRow>
							) : heroButtons.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
										No hero buttons found.
									</TableCell>
								</TableRow>
							) : (
								heroButtons.map((item) => (
									<TableRow key={item._id}>
										<TableCell>{item.name}</TableCell>
										<TableCell className="max-w-[280px] truncate">{item.link}</TableCell>
										<TableCell>
											<span
												className={cn(
													"px-2 py-1 rounded-full text-xs font-medium",
													item.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
												)}
											>
												{item.isActive ? "Active" : "Inactive"}
											</span>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1">
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleEditHeroButton(item._id)}
												>
													Edit
												</Button>
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleToggleHeroButton(item._id)}
													disabled={heroButtonSubmitting}
												>
													{item.isActive ? "Set Inactive" : "Set Active"}
												</Button>
												<Button
													size="sm"
													variant="destructive"
													onClick={() => handleDeleteHeroButton(item._id)}
													disabled={heroButtonSubmitting}
												>
													Delete
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>

				<Button
					onClick={heroButtonId ? handleUpdateHeroButton : handleCreateHeroButton}
					disabled={heroButtonSubmitting || heroButtonLoading}
				>
					{heroButtonSubmitting ? "Saving..." : heroButtonId ? "Update Hero Button" : "Create Hero Button"}
				</Button>
				{heroButtonId && (
					<p className="text-xs text-muted-foreground">
						Selected status: {heroButtonActive ? "Active" : "Inactive"}
					</p>
				)}
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
								className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition relative group"
							>
								<img
									src={item.phoneImage}
									alt="Hero"
									className="h-48 w-full object-cover"
								/>
								<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
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
						))
					)}
				</div>
			) : (
				<div className="border rounded-lg">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Image</TableHead>

								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Loading heroes...</TableCell>
								</TableRow>
							) : heroes.length === 0 ? (
								<TableRow>
									<TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No hero items found</TableCell>
								</TableRow>
							) : (
								heroes.map((item) => (
									<TableRow key={item._id}>
										<TableCell>
											<img src={item.phoneImage} alt="Hero" className="h-12 w-12 rounded object-cover" />
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
