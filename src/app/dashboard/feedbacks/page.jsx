"use client";

import { useEffect, useState } from "react";
import { apiCall } from "../../../../utils/api";
import URL from "../../../../utils/url";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Filter, Printer, Search, Star } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function FeedbacksPage() {
	const [feedbacks, setFeedbacks] = useState([]);
	const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedFeedback, setSelectedFeedback] = useState(null);
	const [filters, setFilters] = useState({
		dateRange: "all",
		status: "all",
		type: "all",
		rating: "all",
		sortBy: "latest",
	});

	useEffect(() => {
		fetchFeedbacks();
	}, []);

	useEffect(() => {
		applyFilters();
	}, [feedbacks, searchTerm, filters]);

	const fetchFeedbacks = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await apiCall({
				endpoint: URL.feedback,
				method: "GET",
			});

			if (response?.success) {
				setFeedbacks(response.data || []);
			} else {
				setError(response?.message || "Failed to fetch feedbacks");
			}
		} catch (err) {
			console.error("Error fetching feedbacks:", err);
			setError("Failed to load feedbacks. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const applyFilters = () => {
		let filtered = [...feedbacks];

		if (searchTerm) {
			const query = searchTerm.toLowerCase();
			filtered = filtered.filter((feedback) => {
				const userName = feedback.user?.name?.toLowerCase() || "";
				const phone = feedback.user?.phone || "";
				const storeName = feedback.store?.name?.toLowerCase() || "";
				const message = feedback.message?.toLowerCase() || "";
				const type = feedback.type?.toLowerCase() || "";
				const status = feedback.status?.toLowerCase() || "";

				return (
					userName.includes(query) ||
					phone.includes(searchTerm) ||
					storeName.includes(query) ||
					message.includes(query) ||
					type.includes(query) ||
					status.includes(query)
				);
			});
		}

		if (filters.dateRange !== "all") {
			const now = new Date();
			filtered = filtered.filter((feedback) => {
				const feedbackDate = new Date(feedback.createdAt);
				switch (filters.dateRange) {
					case "thisWeek": {
						const startOfWeek = new Date(now);
						startOfWeek.setDate(now.getDate() - now.getDay());
						return feedbackDate >= startOfWeek;
					}
					case "thisMonth":
						return (
							feedbackDate.getMonth() === now.getMonth() &&
							feedbackDate.getFullYear() === now.getFullYear()
						);
					case "thisYear":
						return feedbackDate.getFullYear() === now.getFullYear();
					case "previousYear":
						return feedbackDate.getFullYear() === now.getFullYear() - 1;
					case "last5Years":
						return feedbackDate.getFullYear() >= now.getFullYear() - 5;
					default:
						return true;
				}
			});
		}

		if (filters.status !== "all") {
			filtered = filtered.filter((feedback) => feedback.status === filters.status);
		}

		if (filters.type !== "all") {
			filtered = filtered.filter((feedback) => feedback.type === filters.type);
		}

		if (filters.rating !== "all") {
			filtered = filtered.filter(
				(feedback) => String(feedback.rating || 0) === String(filters.rating)
			);
		}

		filtered.sort((a, b) => {
			switch (filters.sortBy) {
				case "oldest":
					return new Date(a.createdAt) - new Date(b.createdAt);
				case "highestRating":
					return (b.rating || 0) - (a.rating || 0);
				case "lowestRating":
					return (a.rating || 0) - (b.rating || 0);
				case "latest":
				default:
					return new Date(b.createdAt) - new Date(a.createdAt);
			}
		});

		setFilteredFeedbacks(filtered);
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

	const getStatusBadge = (status) => {
		const statusConfig = {
			open: { variant: "destructive", label: "Open" },
			in_progress: { variant: "secondary", label: "In Progress" },
			resolved: { variant: "default", label: "Resolved" },
			closed: { variant: "outline", label: "Closed" },
		};

		const config = statusConfig[status] || {
			variant: "secondary",
			label: status || "Unknown",
		};

		return <Badge variant={config.variant}>{config.label}</Badge>;
	};

	const getTypeBadge = (type) => {
		if (!type) return <Badge variant="outline">Unknown</Badge>;
		return <Badge variant="outline">{type}</Badge>;
	};

	const getUniqueValues = (key) => {
		const values = feedbacks
			.map((item) => item[key])
			.filter((value) => value !== null && value !== undefined && value !== "");
		return [...new Set(values)];
	};

	const truncateText = (text, maxLength = 70) => {
		if (!text) return "-";
		return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
	};

	const exportToExcel = () => {
		if (filteredFeedbacks.length === 0) {
			alert("No data to export!");
			return;
		}

		const exportData = filteredFeedbacks.map((feedback) => ({
			"User Name": feedback.user?.name || "-",
			"User Phone": feedback.user?.phone || "-",
			"Store Name": feedback.store?.name || "-",
			Rating: feedback.rating ?? "-",
			Type: feedback.type || "-",
			Status: feedback.status || "-",
			Message: feedback.message || "-",
			Attachments: feedback.attachments?.length || 0,
			"App Version": feedback.metadata?.appVersion || "-",
			Device: feedback.metadata?.deviceInfo || "-",
			OS: feedback.metadata?.os || "-",
			"Created On": formatDate(feedback.createdAt),
		}));

		try {
			const worksheet = XLSX.utils.json_to_sheet(exportData);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, "Feedbacks");

			const excelBuffer = XLSX.write(workbook, {
				bookType: "xlsx",
				type: "array",
			});

			const blob = new Blob([excelBuffer], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});

			saveAs(blob, `feedbacks_${new Date().toISOString().slice(0, 10)}.xlsx`);
		} catch (exportError) {
			console.error("Error exporting feedbacks to Excel:", exportError);
			alert("Failed to export to Excel. Please try again.");
		}
	};

	const exportToPDF = () => {
		if (filteredFeedbacks.length === 0) {
			alert("No data to export!");
			return;
		}

		try {
			const doc = new jsPDF();

			doc.setFontSize(16);
			doc.text("Feedback Report", 14, 15);
			doc.setFontSize(10);
			doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
			doc.text(`Total Feedbacks: ${filteredFeedbacks.length}`, 14, 29);

			const tableColumn = [
				"User",
				"Store",
				"Rating",
				"Type",
				"Status",
				"Message",
				"Created",
			];

			const tableRows = filteredFeedbacks.map((feedback) => [
				feedback.user?.name || "-",
				feedback.store?.name || "-",
				feedback.rating ?? "-",
				feedback.type || "-",
				feedback.status || "-",
				truncateText(feedback.message, 50),
				formatDate(feedback.createdAt),
			]);

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

			doc.save(`feedbacks_${new Date().toISOString().slice(0, 10)}.pdf`);
		} catch (exportError) {
			console.error("Error exporting feedbacks to PDF:", exportError);
			alert("Failed to export to PDF. Please try again.");
		}
	};

	const printTable = () => {
		window.print();
	};

	if (loading) {
		return (
			<Card>
				<CardContent className="p-6">
					<div className="text-center">Loading feedbacks...</div>
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
						<Button onClick={fetchFeedbacks} className="ml-4" variant="outline">
							Retry
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Feedbacks</CardTitle>
				<CardDescription>
					Manage and view all customer feedbacks. Showing: {filteredFeedbacks.length} of{" "}
					{feedbacks.length} feedbacks
				</CardDescription>
			</CardHeader>

			<CardContent>
				<div className="mb-6 flex flex-col gap-4">
					<div className="flex flex-col items-center gap-4 sm:flex-row">
						<div className="relative flex-1">
							<Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
							<Input
								placeholder="Search by user, phone, store, message, type, or status..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-8"
							/>
						</div>

						<label className="text-xs font-medium">Sort By</label>
						<Select
							value={filters.sortBy}
							onValueChange={(value) =>
								setFilters((prev) => ({ ...prev, sortBy: value }))
							}
						>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Select sorting" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="latest">By Latest</SelectItem>
								<SelectItem value="oldest">By Oldest</SelectItem>
								<SelectItem value="highestRating">By Highest Rating</SelectItem>
								<SelectItem value="lowestRating">By Lowest Rating</SelectItem>
							</SelectContent>
						</Select>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="whitespace-nowrap">
									<Filter className="mr-2 h-4 w-4" />
									Filters
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56">
								<div className="space-y-2 p-2">
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
												<SelectItem value="previousYear">Previous Year</SelectItem>
												<SelectItem value="last5Years">Last 5 Years</SelectItem>
											</SelectContent>
										</Select>
									</div>

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
												{getUniqueValues("status").map((status) => (
													<SelectItem key={status} value={status}>
														{status}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div>
										<label className="text-xs font-medium">Type</label>
										<Select
											value={filters.type}
											onValueChange={(value) =>
												setFilters((prev) => ({ ...prev, type: value }))
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">All Types</SelectItem>
												{getUniqueValues("type").map((type) => (
													<SelectItem key={type} value={type}>
														{type}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div>
										<label className="text-xs font-medium">Rating</label>
										<Select
											value={filters.rating}
											onValueChange={(value) =>
												setFilters((prev) => ({ ...prev, rating: value }))
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">All Ratings</SelectItem>
												<SelectItem value="5">5 Star</SelectItem>
												<SelectItem value="4">4 Star</SelectItem>
												<SelectItem value="3">3 Star</SelectItem>
												<SelectItem value="2">2 Star</SelectItem>
												<SelectItem value="1">1 Star</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</DropdownMenuContent>
						</DropdownMenu>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="whitespace-nowrap">
									<Download className="mr-2 h-4 w-4" />
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
									<Printer className="mr-2 h-4 w-4" />
									Print
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>User</TableHead>
								<TableHead>Store</TableHead>
								<TableHead>Rating</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Message</TableHead>
								<TableHead>Attachments</TableHead>
								<TableHead>Created</TableHead>
								<TableHead>Action</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{filteredFeedbacks.length === 0 ? (
								<TableRow>
									<TableCell colSpan={9} className="py-8 text-center">
										<div className="text-muted-foreground">
											No feedbacks found matching your criteria
										</div>
									</TableCell>
								</TableRow>
							) : (
								filteredFeedbacks.map((feedback) => (
									<TableRow key={feedback._id}>
										<TableCell className="font-medium">
											<div className="flex flex-col">
												<span>{feedback.user?.name || "Unknown User"}</span>
												<span className="text-muted-foreground text-xs">
													{feedback.user?.phone || "No phone"}
												</span>
											</div>
										</TableCell>

										<TableCell>
											<div className="flex flex-col">
												<span>{feedback.store?.name || "Unknown Store"}</span>
												<span className="text-muted-foreground text-xs">
													{feedback.store?.type || "-"}
												</span>
											</div>
										</TableCell>

										<TableCell>
											<div className="flex items-center gap-1">
												<Star className="h-4 w-4 fill-amber-400 text-amber-400" />
												<span>{feedback.rating ?? "-"}</span>
											</div>
										</TableCell>

										<TableCell>{getTypeBadge(feedback.type)}</TableCell>
										<TableCell>{getStatusBadge(feedback.status)}</TableCell>

										<TableCell className="max-w-[260px] whitespace-normal">
											{truncateText(feedback.message)}
										</TableCell>

										<TableCell>{feedback.attachments?.length || 0}</TableCell>
										<TableCell>{formatDate(feedback.createdAt)}</TableCell>

										<TableCell>
											<Dialog>
												<DialogTrigger asChild>
													<Button
														variant="outline"
														size="sm"
														onClick={() => setSelectedFeedback(feedback)}
													>
														Details
													</Button>
												</DialogTrigger>

												<DialogContent className="max-w-2xl">
													<DialogHeader>
														<DialogTitle>
															{selectedFeedback?.store?.name || "Feedback Details"}
														</DialogTitle>
														<DialogDescription>
															Complete feedback details including user, store,
															metadata, and attachments.
														</DialogDescription>
													</DialogHeader>

													{selectedFeedback && (
														<div className="mt-4 space-y-4">
															<div>
																<h4 className="font-semibold">Feedback</h4>
																<p>Rating: {selectedFeedback.rating ?? "N/A"}</p>
																<p>Type: {selectedFeedback.type || "N/A"}</p>
																<p>Status: {selectedFeedback.status || "N/A"}</p>
																<p className="whitespace-pre-wrap">
																	Message: {selectedFeedback.message || "N/A"}
																</p>
																<p>
																	Created: {formatDate(selectedFeedback.createdAt)}
																</p>
															</div>

															<div>
																<h4 className="font-semibold">User</h4>
																<p>Name: {selectedFeedback.user?.name || "N/A"}</p>
																<p>
																	Phone: {selectedFeedback.user?.phone || "N/A"}
																</p>
																<p>Email: {selectedFeedback.user?.email || "N/A"}</p>
															</div>

															<div>
																<h4 className="font-semibold">Store</h4>
																<p>
																	Name: {selectedFeedback.store?.name || "N/A"}
																</p>
																<p>
																	Type: {selectedFeedback.store?.type || "N/A"}
																</p>
																<p>
																	Contact: {selectedFeedback.store?.contactNo || "N/A"}
																</p>
																<p>
																	Address: {selectedFeedback.store?.address?.street || ""}
																	{selectedFeedback.store?.address?.city
																		? `, ${selectedFeedback.store.address.city}`
																		: ""}
																	{selectedFeedback.store?.address?.state
																		? `, ${selectedFeedback.store.address.state}`
																		: ""}
																	{selectedFeedback.store?.address?.country
																		? `, ${selectedFeedback.store.address.country}`
																		: ""}
																</p>
															</div>

															<div>
																<h4 className="font-semibold">Metadata</h4>
																<p>
																	App Version: {selectedFeedback.metadata?.appVersion || "N/A"}
																</p>
																<p>
																	Device: {selectedFeedback.metadata?.deviceInfo || "N/A"}
																</p>
																<p>OS: {selectedFeedback.metadata?.os || "N/A"}</p>
															</div>

															<div>
																<h4 className="font-semibold">Attachments</h4>
																{selectedFeedback.attachments?.length ? (
																	<div className="space-y-1">
																		{selectedFeedback.attachments.map((link, index) => (
																			<p key={`${link}-${index}`} className="break-all text-sm">
																				{index + 1}. {link}
																			</p>
																		))}
																	</div>
																) : (
																	<p>No attachments</p>
																)}
															</div>
														</div>
													)}
												</DialogContent>
											</Dialog>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
