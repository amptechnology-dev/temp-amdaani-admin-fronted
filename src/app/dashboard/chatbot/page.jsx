"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, RefreshCw, Search, Pencil, Trash2 } from "lucide-react";

export default function ChatbotPage() {
	const [prompts, setPrompts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");

	const [open, setOpen] = useState(false);
	const [editMode, setEditMode] = useState(false);
	const [selectedPromptId, setSelectedPromptId] = useState(null);

	const [question, setQuestion] = useState("");
	const [keywordsInput, setKeywordsInput] = useState("");
	const [answer, setAnswer] = useState("");
	const [category, setCategory] = useState("general");
	const [isActive, setIsActive] = useState(true);

	useEffect(() => {
		fetchPrompts();
	}, []);

	const fetchPrompts = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await apiCall({
				endpoint: URL.chatbot,
				method: "GET",
			});

			if (response?.success) {
				setPrompts(Array.isArray(response.data) ? response.data : []);
			} else {
				setPrompts([]);
				setError(response?.message || "Failed to fetch chatbot prompts");
			}
		} catch (err) {
			console.error("Error fetching chatbot prompts:", err);
			setPrompts([]);
			setError("Failed to load chatbot prompts. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setQuestion("");
		setKeywordsInput("");
		setAnswer("");
		setCategory("general");
		setIsActive(true);
		setEditMode(false);
		setSelectedPromptId(null);
	};

	const handleOpenAdd = () => {
		resetForm();
		setOpen(true);
	};

	const handleOpenEdit = (item) => {
		setEditMode(true);
		setSelectedPromptId(item._id);
		setQuestion(item.question || "");
		setKeywordsInput(
			Array.isArray(item.keywords) ? item.keywords.join(", ") : ""
		);
		setAnswer(item.answer || "");
		setCategory(item.category || "general");
		setIsActive(Boolean(item.isActive));
		setOpen(true);
	};

	const parseKeywords = (raw) => {
		return String(raw || "")
			.split(",")
			.map((token) => token.trim())
			.filter(Boolean);
	};

	const handleSavePrompt = async () => {
		if (!question.trim()) {
			alert("Please enter a question.");
			return;
		}

		if (!answer.trim()) {
			alert("Please enter an answer.");
			return;
		}

		const keywords = parseKeywords(keywordsInput);
		if (!keywords.length) {
			alert("Please enter at least one keyword.");
			return;
		}

		setSubmitting(true);
		try {
			const payload = {
				question: question.trim(),
				keywords,
				answer: answer.trim(),
				category: category.trim() || "general",
				isActive,
			};

			const response = await apiCall({
				endpoint: editMode
					? `${URL.chatbot}/${selectedPromptId}`
					: URL.chatbot,
				method: editMode ? "PUT" : "POST",
				body: payload,
			});

			if (response?.success) {
				await fetchPrompts();
				setOpen(false);
				resetForm();
			} else {
				alert(
					response?.message ||
						`Failed to ${editMode ? "update" : "create"} chatbot prompt.`
				);
			}
		} catch (err) {
			console.error("Error saving chatbot prompt:", err);
			alert("Failed to save chatbot prompt. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	const handleDeletePrompt = async (promptId) => {
		const confirmed = window.confirm(
			"Are you sure you want to delete this chatbot prompt?"
		);
		if (!confirmed) return;

		try {
			const response = await apiCall({
				endpoint: `${URL.chatbot}/${promptId}`,
				method: "DELETE",
			});

			if (response?.success) {
				await fetchPrompts();
			} else {
				alert(response?.message || "Failed to delete chatbot prompt.");
			}
		} catch (err) {
			console.error("Error deleting chatbot prompt:", err);
			alert("Failed to delete chatbot prompt. Please try again.");
		}
	};

	const filteredPrompts = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		if (!query) return prompts;

		return prompts.filter((item) => {
			const q = item.question?.toLowerCase() || "";
			const a = item.answer?.toLowerCase() || "";
			const c = item.category?.toLowerCase() || "";
			const k = Array.isArray(item.keywords)
				? item.keywords.join(" ").toLowerCase()
				: "";

			return (
				q.includes(query) ||
				a.includes(query) ||
				c.includes(query) ||
				k.includes(query)
			);
		});
	}, [prompts, searchTerm]);

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

	return (
		<Card>
			<CardHeader>
				<CardTitle>Chatbot Prompts</CardTitle>
				<CardDescription>
					Manage AI suggestion prompts. Showing: {filteredPrompts.length} of {" "}
					{prompts.length} prompts
				</CardDescription>
			</CardHeader>

			<CardContent>
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative w-full sm:max-w-md">
						<Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
						<Input
							placeholder="Search by question, keyword, answer, category..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-8"
						/>
					</div>

					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={fetchPrompts} disabled={loading}>
							<RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
							Refresh
						</Button>

						<Dialog open={open} onOpenChange={setOpen}>
							<DialogTrigger asChild>
								<Button onClick={handleOpenAdd}>
									<PlusCircle className="mr-2 h-4 w-4" />
									Add Prompt
								</Button>
							</DialogTrigger>

							<DialogContent className="max-w-2xl">
								<DialogHeader>
									<DialogTitle>
										{editMode ? "Edit Chatbot Prompt" : "Create Chatbot Prompt"}
									</DialogTitle>
									<DialogDescription>
										{editMode
											? "Update question, keywords, and answer sent to AI context."
											: "Add a new prompt suggestion for chatbot responses."}
									</DialogDescription>
								</DialogHeader>

								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="chatbot-question">Question</Label>
										<Input
											id="chatbot-question"
											value={question}
											onChange={(e) => setQuestion(e.target.value)}
											placeholder="barcode"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="chatbot-keywords">Keywords (comma separated)</Label>
										<Input
											id="chatbot-keywords"
											value={keywordsInput}
											onChange={(e) => setKeywordsInput(e.target.value)}
											placeholder="barcode, scanner, barcode billing"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="chatbot-answer">Answer</Label>
										<textarea
											id="chatbot-answer"
											value={answer}
											onChange={(e) => setAnswer(e.target.value)}
											placeholder="Yes, barcode billing is supported."
											className="min-h-32 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
										/>
									</div>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="chatbot-category">Category</Label>
											<Input
												id="chatbot-category"
												value={category}
												onChange={(e) => setCategory(e.target.value)}
												placeholder="general"
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="chatbot-active">Status</Label>
											<label
												htmlFor="chatbot-active"
												className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm"
											>
												<input
													id="chatbot-active"
													type="checkbox"
													checked={isActive}
													onChange={(e) => setIsActive(e.target.checked)}
												/>
												Active prompt
											</label>
										</div>
									</div>

									<Button
										className="w-full"
										onClick={handleSavePrompt}
										disabled={submitting}
									>
										{submitting
											? editMode
												? "Updating..."
												: "Creating..."
											: editMode
											? "Update Prompt"
											: "Save Prompt"}
									</Button>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				</div>

				{error ? (
					<div className="text-center text-destructive">
						{error}
						<Button onClick={fetchPrompts} className="ml-4" variant="outline">
							Retry
						</Button>
					</div>
				) : (
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Question</TableHead>
									<TableHead>Keywords</TableHead>
									<TableHead>Answer</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Updated</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
											Loading chatbot prompts...
										</TableCell>
									</TableRow>
								) : filteredPrompts.length === 0 ? (
									<TableRow>
										<TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
											No prompts found
										</TableCell>
									</TableRow>
								) : (
									filteredPrompts.map((item) => (
										<TableRow key={item._id}>
											<TableCell className="max-w-[220px] whitespace-normal font-medium">
												{item.question}
											</TableCell>
											<TableCell className="max-w-[260px] whitespace-normal">
												{Array.isArray(item.keywords) && item.keywords.length
													? item.keywords.join(", ")
													: "N/A"}
											</TableCell>
											<TableCell className="max-w-[340px] whitespace-normal">
												{item.answer}
											</TableCell>
											<TableCell>{item.category || "general"}</TableCell>
											<TableCell>
												<span
													className={`rounded-full px-2.5 py-1 text-xs font-medium ${
														item.isActive
															? "bg-emerald-100 text-emerald-700"
															: "bg-slate-200 text-slate-700"
													}`}
												>
													{item.isActive ? "Active" : "Inactive"}
												</span>
											</TableCell>
											<TableCell>{formatDate(item.updatedAt || item.createdAt)}</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Button
														size="icon"
														variant="outline"
														onClick={() => handleOpenEdit(item)}
													>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														size="icon"
														variant="destructive"
														onClick={() => handleDeletePrompt(item._id)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
