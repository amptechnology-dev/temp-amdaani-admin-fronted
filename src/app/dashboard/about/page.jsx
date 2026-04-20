"use client";

import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	PlusCircle,
	RefreshCw,
	Pencil,
	Trash2,
	Users,
	TrendingUp,
	Shield,
	Globe,
	Zap,
	IndianRupee,
	Rocket,
	Star,
	Sparkles,
	CheckCircle2,
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

const STAT_ICON_OPTIONS = [
	{ value: "Users", label: "Users", Icon: Users },
	{ value: "TrendingUp", label: "Trending Up", Icon: TrendingUp },
	{ value: "Shield", label: "Shield", Icon: Shield },
	{ value: "Globe", label: "Globe", Icon: Globe },
	{ value: "Zap", label: "Zap", Icon: Zap },
	{ value: "IndianRupee", label: "Indian Rupee", Icon: IndianRupee },
	{ value: "Rocket", label: "Rocket", Icon: Rocket },
	{ value: "Star", label: "Star", Icon: Star },
];

const VALUE_ICON_OPTIONS = [
	{ value: "Zap", label: "Zap", Icon: Zap },
	{ value: "IndianRupee", label: "Indian Rupee", Icon: IndianRupee },
	{ value: "Shield", label: "Shield", Icon: Shield },
	{ value: "Globe", label: "Globe", Icon: Globe },
	{ value: "TrendingUp", label: "Trending Up", Icon: TrendingUp },
	{ value: "Rocket", label: "Rocket", Icon: Rocket },
	{ value: "Sparkles", label: "Sparkles", Icon: Sparkles },
	{ value: "CheckCircle2", label: "Check Circle", Icon: CheckCircle2 },
];

const DEFAULT_STATS = [
	{ number: "", label: "", icon: "" },
];

const DEFAULT_MISSION_POINTS = [""];

const DEFAULT_VALUES = [
	{ icon: "", title: "", description: "", color: "" },
];

const createDefaultValueColorPicker = () => ({
	color1: "#3b82f6",
	color2: "#8b5cf6",
	color3: "#ec4899",
});

const extractHexColorsFromGradient = (gradient) => {
	if (!gradient || !gradient.startsWith("linear-gradient")) return null;
	const matches = gradient.match(/#[0-9a-fA-F]{6}/g);
	if (!matches || matches.length < 3) return null;
	return {
		color1: matches[0],
		color2: matches[1],
		color3: matches[2],
	};
};

const AboutPage = () => {
	const [abouts, setAbouts] = React.useState([]);
	const [loading, setLoading] = React.useState(false);
	const [open, setOpen] = React.useState(false);
	const [submitting, setSubmitting] = React.useState(false);
	const [editMode, setEditMode] = React.useState(false);
	const [selectedId, setSelectedId] = React.useState(null);

	const [badgeTitle, setBadgeTitle] = React.useState("");
	const [heading, setHeading] = React.useState("");
	const [highlightText, setHighlightText] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [stats, setStats] = React.useState(DEFAULT_STATS);
	const [missionTitle, setMissionTitle] = React.useState("");
	const [missionDescription, setMissionDescription] = React.useState("");
	const [missionPoints, setMissionPoints] = React.useState(DEFAULT_MISSION_POINTS);
	const [values, setValues] = React.useState(DEFAULT_VALUES);
	const [valueColorPickers, setValueColorPickers] = React.useState([
		createDefaultValueColorPicker(),
	]);
	const [isActive, setIsActive] = React.useState(true);

	const fetchAbouts = async () => {
		setLoading(true);
		try {
			const response = await apiCall({
				endpoint: URL.about,
				method: "GET",
				token: true,
			});

			if (response?.success && Array.isArray(response.data)) {
				setAbouts(response.data);
			} else {
				setAbouts([]);
				toast.error(response?.message || "Failed to fetch about sections.");
			}
		} catch (error) {
			setAbouts([]);
			toast.error("Network Error", {
				description: error.message || "Could not fetch about sections.",
			});
		} finally {
			setLoading(false);
		}
	};

	React.useEffect(() => {
		fetchAbouts();
	}, []);

	const resetForm = () => {
		setBadgeTitle("");
		setHeading("");
		setHighlightText("");
		setDescription("");
		setStats(DEFAULT_STATS.map((item) => ({ ...item })));
		setMissionTitle("");
		setMissionDescription("");
		setMissionPoints([...DEFAULT_MISSION_POINTS]);
		setValues(DEFAULT_VALUES.map((item) => ({ ...item })));
		setValueColorPickers([createDefaultValueColorPicker()]);
		setIsActive(true);
		setEditMode(false);
		setSelectedId(null);
	};

	const handleStatChange = (index, key, value) => {
		setStats((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], [key]: value };
			return next;
		});
	};

	const addStat = () => {
		setStats((prev) => [...prev, { number: "", label: "", icon: "" }]);
	};

	const removeStat = (index) => {
		setStats((prev) => prev.filter((_, i) => i !== index));
	};

	const handleMissionPointChange = (index, value) => {
		setMissionPoints((prev) => {
			const next = [...prev];
			next[index] = value;
			return next;
		});
	};

	const addMissionPoint = () => {
		setMissionPoints((prev) => [...prev, ""]);
	};

	const removeMissionPoint = (index) => {
		setMissionPoints((prev) => prev.filter((_, i) => i !== index));
	};

	const handleValueChange = (index, key, value) => {
		setValues((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], [key]: value };
			return next;
		});
	};

	const addValue = () => {
		setValues((prev) => [
			...prev,
			{ icon: "", title: "", description: "", color: "" },
		]);
		setValueColorPickers((prev) => [...prev, createDefaultValueColorPicker()]);
	};

	const removeValue = (index) => {
		setValues((prev) => prev.filter((_, i) => i !== index));
		setValueColorPickers((prev) => prev.filter((_, i) => i !== index));
	};

	const handleValueColorPickerChange = (index, key, value) => {
		setValueColorPickers((prev) => {
			const next = [...prev];
			const current = next[index] || createDefaultValueColorPicker();
			next[index] = { ...current, [key]: value };

			const { color1, color2, color3 } = next[index];
			handleValueChange(
				index,
				"color",
				`linear-gradient(90deg, ${color1}, ${color2}, ${color3})`
			);

			return next;
		});
	};

	const fillFormFromItem = (item) => {
		setSelectedId(item._id);
		setBadgeTitle(item.badgeTitle || "");
		setHeading(item.heading || "");
		setHighlightText(item.highlightText || "");
		setDescription(item.description || "");
		setMissionTitle(item.missionTitle || "");
		setMissionDescription(item.missionDescription || "");
		setIsActive(item.isActive ?? true);

		const itemStats = Array.isArray(item.stats) ? item.stats : [];
		setStats(
			itemStats.length > 0
				? itemStats.map((stat) => ({
						number: stat?.number || "",
						label: stat?.label || "",
						icon: stat?.icon || "",
				  }))
				: []
		);

		const itemPoints = Array.isArray(item.missionPoints) ? item.missionPoints : [];
		setMissionPoints(itemPoints.length > 0 ? [...itemPoints] : [""]);

		const itemValues = Array.isArray(item.values) ? item.values : [];

		if (itemValues.length > 0) {
			setValues(
				itemValues.map((value) => ({
					icon: value?.icon || "",
					title: value?.title || "",
					description: value?.description || "",
					color: value?.color || "",
				}))
			);

			setValueColorPickers(
				itemValues.map((value) => {
					const parsed = extractHexColorsFromGradient(value?.color || "");
					return parsed || createDefaultValueColorPicker();
				})
			);
		} else {
			setValues([{ icon: "", title: "", description: "", color: "" }]);
			setValueColorPickers([createDefaultValueColorPicker()]);
		}
	};

	const validateForm = () => {
		if (!heading.trim()) return "Please enter heading.";
		if (!highlightText.trim()) return "Please enter highlight text.";
		if (!description.trim()) return "Please enter description.";
		if (!missionTitle.trim()) return "Please enter mission title.";
		if (!missionDescription.trim()) return "Please enter mission description.";

		const hasAnyStatInput = stats.some(
			(item) => item.number.trim() || item.label.trim() || item.icon.trim()
		);
		if (hasAnyStatInput) {
			const invalidStat = stats.some((item) => {
				const hasRowInput =
					item.number.trim() || item.label.trim() || item.icon.trim();
				if (!hasRowInput) return false;
				return !item.number.trim() || !item.label.trim() || !item.icon.trim();
			});
			if (invalidStat) {
				return "For stats, fill number, label, and icon for each entered row.";
			}
		}

		if (missionPoints.length === 0) {
			return "Please add at least one mission point.";
		}

		const invalidPoint = missionPoints.some((point) => !point.trim());
		if (invalidPoint) return "Please fill all mission points.";

		if (values.length === 0) {
			return "Please add at least one value card.";
		}

		const invalidValue = values.some(
			(item) =>
				!item.icon.trim() ||
				!item.title.trim() ||
				!item.description.trim() ||
				!item.color.trim()
		);
		if (invalidValue) return "Please fill all value cards fields and icons.";

		return null;
	};

	const buildPayload = () => ({
		badgeTitle: badgeTitle.trim(),
		heading: heading.trim(),
		highlightText: highlightText.trim(),
		description: description.trim(),
		stats: stats
			.map((item) => ({
				number: item.number.trim(),
				label: item.label.trim(),
				icon: item.icon.trim(),
			}))
			.filter((item) => item.number || item.label || item.icon),
		missionTitle: missionTitle.trim(),
		missionDescription: missionDescription.trim(),
		missionPoints: missionPoints
			.map((point) => point.trim())
			.filter((point) => point),
		values: values.map((item) => ({
			icon: item.icon.trim(),
			title: item.title.trim(),
			description: item.description.trim(),
			color: item.color.trim(),
		})),
		isActive,
	});

	const handleCreate = async () => {
		const validationMessage = validateForm();
		if (validationMessage) return toast.error(validationMessage);

		setSubmitting(true);
		try {
			const response = await apiCall({
				endpoint: URL.about,
				method: "POST",
				body: buildPayload(),
				token: true,
			});

			if (response?.success) {
				toast.success("About section created successfully!");
				await fetchAbouts();
				setOpen(false);
				resetForm();
			} else {
				toast.error(response?.message || "Failed to create about section.");
			}
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		} finally {
			setSubmitting(false);
		}
	};

	const handleUpdate = async () => {
		if (!selectedId) return toast.error("No about item selected.");

		const validationMessage = validateForm();
		if (validationMessage) return toast.error(validationMessage);

		setSubmitting(true);
		try {
			const response = await apiCall({
				endpoint: `${URL.about}/${selectedId}`,
				method: "PUT",
				body: buildPayload(),
				token: true,
			});

			if (response?.success) {
				toast.success("About section updated successfully!");
				await fetchAbouts();
				setOpen(false);
				resetForm();
			} else {
				toast.error(response?.message || "Failed to update about section.");
			}
		} catch (error) {
			toast.error("Network Error", { description: error.message });
		} finally {
			setSubmitting(false);
		}
	};

	const AboutFormDialog = () => (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="w-[96vw] max-w-7xl max-h-[85vh] overflow-auto">
				<DialogHeader>
					<DialogTitle>
						{editMode ? "Update About Section" : "Create About Section"}
					</DialogTitle>
					<DialogDescription>
						{editMode
							? "Update about content using PUT /about/:id"
							: "Create a new about section payload"}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="badgeTitle">Badge Title</Label>
							<Input
								id="badgeTitle"
								value={badgeTitle}
								onChange={(e) => setBadgeTitle(e.target.value)}
								placeholder="About Amdaani"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="highlightText">Highlight Text *</Label>
							<Input
								id="highlightText"
								value={highlightText}
								onChange={(e) => setHighlightText(e.target.value)}
								placeholder="Made in India"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="heading">Heading *</Label>
						<Input
							id="heading"
							value={heading}
							onChange={(e) => setHeading(e.target.value)}
							placeholder="Revolutionizing Business Management"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description *</Label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Amdaani is the fastest and most affordable billing solution..."
							className="w-full rounded-md border px-3 py-2 text-sm resize-vertical min-h-[90px]"
						/>
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-semibold">Stats</h3>
							<Button type="button" variant="outline" size="sm" onClick={addStat}>
								<PlusCircle className="h-4 w-4 mr-2" />
								Add Stat
							</Button>
						</div>
						{stats.length === 0 && (
							<p className="text-sm text-muted-foreground">
								No stats added. Click "Add Stat" to create one.
							</p>
						)}
						{stats.map((item, index) => (
							<div key={index} className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
								<Input
									className="lg:col-span-2 min-w-0"
									value={item.number}
									onChange={(e) =>
										handleStatChange(index, "number", e.target.value)
									}
									placeholder={`Stat ${index + 1} Number`}
								/>
								<Input
									className="lg:col-span-4 min-w-0"
									value={item.label}
									onChange={(e) =>
										handleStatChange(index, "label", e.target.value)
									}
									placeholder={`Stat ${index + 1} Label`}
								/>
								<div className="lg:col-span-4 min-w-0">
									<Select
										value={item.icon}
										onValueChange={(value) => handleStatChange(index, "icon", value)}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select icon" />
										</SelectTrigger>
										<SelectContent>
											{item.icon && !STAT_ICON_OPTIONS.some((option) => option.value === item.icon) && (
												<SelectItem value={item.icon}>{item.icon}</SelectItem>
											)}
											{STAT_ICON_OPTIONS.map((option) => {
												const Icon = option.Icon;
												return (
													<SelectItem key={option.value} value={option.value}>
														<div className="flex items-center gap-2">
															<Icon className="h-4 w-4" />
															<span>{option.label}</span>
														</div>
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
								</div>
								<Button
									className="lg:col-span-2 w-full"
									type="button"
									size="icon"
									variant="destructive"
									onClick={() => removeStat(index)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="missionTitle">Mission Title *</Label>
							<Input
								id="missionTitle"
								value={missionTitle}
								onChange={(e) => setMissionTitle(e.target.value)}
								placeholder="Our Mission"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="missionDescription">Mission Description *</Label>
							<Input
								id="missionDescription"
								value={missionDescription}
								onChange={(e) => setMissionDescription(e.target.value)}
								placeholder="To democratize business management tools..."
							/>
						</div>
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-semibold">Mission Points *</h3>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addMissionPoint}
							>
								<PlusCircle className="h-4 w-4 mr-2" />
								Add Point
							</Button>
						</div>
						{missionPoints.map((point, index) => (
							<div key={index} className="flex gap-2">
								<Input
									value={point}
									onChange={(e) => handleMissionPointChange(index, e.target.value)}
									placeholder={`Mission Point ${index + 1}`}
								/>
								<Button
									type="button"
									size="icon"
									variant="destructive"
									onClick={() => removeMissionPoint(index)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-semibold">Values *</h3>
							<Button type="button" variant="outline" size="sm" onClick={addValue}>
								<PlusCircle className="h-4 w-4 mr-2" />
								Add Value
							</Button>
						</div>
						{values.map((item, index) => (
							<div key={index} className="space-y-3 border rounded-md p-3">
								<div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
								<div className="xl:col-span-2 min-w-0">
									<Select
										value={item.icon}
										onValueChange={(value) => handleValueChange(index, "icon", value)}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select icon" />
										</SelectTrigger>
										<SelectContent>
											{item.icon && !VALUE_ICON_OPTIONS.some((option) => option.value === item.icon) && (
												<SelectItem value={item.icon}>{item.icon}</SelectItem>
											)}
											{VALUE_ICON_OPTIONS.map((option) => {
												const Icon = option.Icon;
												return (
													<SelectItem key={option.value} value={option.value}>
														<div className="flex items-center gap-2">
															<Icon className="h-4 w-4" />
															<span>{option.label}</span>
														</div>
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
								</div>
								<Input
									className="xl:col-span-2 min-w-0"
									value={item.title}
									onChange={(e) => handleValueChange(index, "title", e.target.value)}
									placeholder="Value title"
								/>
								<Input
									className="xl:col-span-3 min-w-0"
									value={item.description}
									onChange={(e) => handleValueChange(index, "description", e.target.value)}
									placeholder="Value description"
								/>
								<Input
									className="xl:col-span-3 min-w-0"
									value={item.color}
									onChange={(e) => handleValueChange(index, "color", e.target.value)}
									placeholder="linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)"
								/>
								<Button
									className="xl:col-span-2 w-full"
									type="button"
									size="icon"
									variant="destructive"
									onClick={() => removeValue(index)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
								</div>

								<div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
									<div className="lg:col-span-3 flex items-center gap-2">
										<Label className="text-xs">Color 1</Label>
										<input
											type="color"
											value={valueColorPickers[index]?.color1 || "#3b82f6"}
											onChange={(e) =>
												handleValueColorPickerChange(index, "color1", e.target.value)
											}
											className="w-8 h-8 p-0 border rounded"
										/>
									</div>
									<div className="lg:col-span-3 flex items-center gap-2">
										<Label className="text-xs">Color 2</Label>
										<input
											type="color"
											value={valueColorPickers[index]?.color2 || "#8b5cf6"}
											onChange={(e) =>
												handleValueColorPickerChange(index, "color2", e.target.value)
											}
											className="w-8 h-8 p-0 border rounded"
										/>
									</div>
									<div className="lg:col-span-3 flex items-center gap-2">
										<Label className="text-xs">Color 3</Label>
										<input
											type="color"
											value={valueColorPickers[index]?.color3 || "#ec4899"}
											onChange={(e) =>
												handleValueColorPickerChange(index, "color3", e.target.value)
											}
											className="w-8 h-8 p-0 border rounded"
										/>
									</div>
									<div className="lg:col-span-3">
										<div
											className={cn(
												"h-8 rounded-md border overflow-hidden",
												!item.color && "bg-gray-100"
											)}
											style={
												item.color && item.color.startsWith("linear-gradient")
													? { background: item.color }
													: undefined
											}
										>
											{!item.color && <div className="h-full w-full" />}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>

					{editMode && (
						<div className="flex items-center gap-2">
							<input
								id="isActive"
								type="checkbox"
								checked={isActive}
								onChange={(e) => setIsActive(e.target.checked)}
							/>
							<Label htmlFor="isActive">Active</Label>
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
							"Update About"
						) : (
							"Save About"
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">About Master</h1>
				<div className="flex gap-2">
					<Button variant="outline" onClick={fetchAbouts} disabled={loading}>
						<RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
						Refresh
					</Button>
					<Button
						onClick={() => {
							resetForm();
							setOpen(true);
						}}
					>
						<PlusCircle className="w-4 h-4 mr-2" />
						Create About
					</Button>
				</div>
			</div>

			<div className="border rounded-lg">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Heading</TableHead>
							<TableHead>Highlight</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Updated</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
									Loading about sections...
								</TableCell>
							</TableRow>
						) : abouts.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
									No about sections found
								</TableCell>
							</TableRow>
						) : (
							abouts.map((item) => (
								<TableRow key={item._id}>
									<TableCell>{item.heading}</TableCell>
									<TableCell>{item.highlightText}</TableCell>
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
										{item.updatedAt
											? new Date(item.updatedAt).toLocaleDateString("en-IN")
											: "-"}
									</TableCell>
									<TableCell>
										<Button
											size="sm"
											variant="outline"
											onClick={() => {
												fillFormFromItem(item);
												setEditMode(true);
												setOpen(true);
											}}
										>
											<Pencil className="h-4 w-4 mr-2" />
											Edit
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{AboutFormDialog()}
		</div>
	);
};

export default AboutPage;
