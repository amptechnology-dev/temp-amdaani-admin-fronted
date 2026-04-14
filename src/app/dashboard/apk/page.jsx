"use client";

import { useEffect, useState } from "react";
import { apiCall } from "../../../../utils/api";
import URL from "../../../../utils/url";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";

const APP_VERSION_ENDPOINT = URL.appVersion || "http://localhost:8001/api/app-version";
const UPLOAD_APK_ENDPOINT = URL.uploadApk || "http://localhost:8001/api/app-version/upload-apk";

export default function ApkPage() {
	const [currentApk, setCurrentApk] = useState(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [uploading, setUploading] = useState(false);

	const [apkFile, setApkFile] = useState(null);
	const [version, setVersion] = useState("");
	const [description, setDescription] = useState("");

	const fetchCurrentApk = async ({ silent = false } = {}) => {
		if (silent) {
			setRefreshing(true);
		} else {
			setLoading(true);
		}

		try {
			const response = await apiCall({
				endpoint: APP_VERSION_ENDPOINT,
				method: "GET",
			});

			if (response?.success && response?.data) {
				setCurrentApk(response.data);
				setVersion(response.data.version || "");
				setDescription(response.data.description || "");
			} else {
				setCurrentApk(null);
				toast.error(response?.message || "Failed to fetch APK details");
			}
		} catch (error) {
			console.error("Failed to fetch APK details:", error);
			toast.error("Failed to fetch APK details");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		fetchCurrentApk();
	}, []);

	const handleFileChange = (event) => {
		const file = event.target.files?.[0] || null;
		setApkFile(file);
	};

	const handleUpload = async (event) => {
		event.preventDefault();

		if (!apkFile) {
			toast.error("Please select APK file");
			return;
		}

		if (!version.trim()) {
			toast.error("Please enter version");
			return;
		}

		if (!description.trim()) {
			toast.error("Please enter description");
			return;
		}

		const payload = new FormData();
		payload.append("apk", apkFile);
		payload.append("version", version.trim());
		payload.append("description", description.trim());

		try {
			setUploading(true);

			const response = await apiCall({
				endpoint: UPLOAD_APK_ENDPOINT,
				method: "POST",
				body: payload,
			});

			if (response?.success) {
				toast.success(response?.message || "APK uploaded successfully");
				setApkFile(null);

				const fileInput = document.getElementById("apk-file-input");
				if (fileInput) {
					fileInput.value = "";
				}

				await fetchCurrentApk({ silent: true });
			} else {
				toast.error(response?.message || "Failed to upload APK");
			}
		} catch (error) {
			console.error("Failed to upload APK:", error);
			toast.error("Failed to upload APK");
		} finally {
			setUploading(false);
		}
	};

	const formatDate = (dateValue) => {
		if (!dateValue) return "N/A";

		try {
			return new Date(dateValue).toLocaleString("en-IN", {
				day: "2-digit",
				month: "short",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch {
			return "N/A";
		}
	};

	return (
		<Card>
			<CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<CardTitle>APK Management</CardTitle>
					<CardDescription>
						View current APK details and upload a new Android build.
					</CardDescription>
				</div>

				<Button variant="outline" onClick={() => fetchCurrentApk({ silent: true })} disabled={refreshing}>
					{refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
					Refresh
				</Button>
			</CardHeader>

			<CardContent className="space-y-6">
				{loading ? (
					<div className="flex items-center justify-center py-8 text-muted-foreground">
						<Loader2 className="mr-2 h-5 w-5 animate-spin" />
						Loading current APK...
					</div>
				) : (
					<div className="rounded-lg border p-4">
						<h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
							Current Active APK
						</h3>

						{currentApk ? (
							<div className="grid gap-3 sm:grid-cols-2">
								<div>
									<p className="text-xs text-muted-foreground">Version</p>
									<p className="font-medium">{currentApk.version || "N/A"}</p>
								</div>

								<div>
									<p className="text-xs text-muted-foreground">Status</p>
									<p className={`font-medium ${currentApk.isActive ? "text-green-600" : "text-red-500"}`}>
										{currentApk.isActive ? "Active" : "Inactive"}
									</p>
								</div>

								<div className="sm:col-span-2">
									<p className="text-xs text-muted-foreground">Description</p>
									<p className="font-medium">{currentApk.description || "N/A"}</p>
								</div>

								<div className="sm:col-span-2">
									<p className="text-xs text-muted-foreground">APK URL</p>
									{currentApk.apkKey ? (
										<a
											href={currentApk.apkKey}
											target="_blank"
											rel="noreferrer"
											className="break-all text-blue-600 hover:underline"
										>
											{currentApk.apkKey}
										</a>
									) : (
										<p className="font-medium">N/A</p>
									)}
								</div>

								<div>
									<p className="text-xs text-muted-foreground">Created At</p>
									<p className="font-medium">{formatDate(currentApk.createdAt)}</p>
								</div>

								<div>
									<p className="text-xs text-muted-foreground">Updated At</p>
									<p className="font-medium">{formatDate(currentApk.updatedAt)}</p>
								</div>
							</div>
						) : (
							<p className="text-sm text-muted-foreground">No APK found yet.</p>
						)}
					</div>
				)}

				<form onSubmit={handleUpload} className="rounded-lg border p-4 space-y-4">
					<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
						Upload New APK
					</h3>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="apk-file-input">APK File</Label>
							<Input
								id="apk-file-input"
								type="file"
								accept=".apk"
								onChange={handleFileChange}
								disabled={uploading}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="apk-version">Version</Label>
							<Input
								id="apk-version"
								type="text"
								placeholder="1.0.3"
								value={version}
								onChange={(event) => setVersion(event.target.value)}
								disabled={uploading}
							/>
						</div>

						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="apk-description">Description</Label>
							<Textarea
								id="apk-description"
								placeholder="Bug fixes and performance improvement"
								value={description}
								onChange={(event) => setDescription(event.target.value)}
								disabled={uploading}
							/>
						</div>
					</div>

					{apkFile && <p className="text-xs text-muted-foreground">Selected file: {apkFile.name}</p>}

					<Button type="submit" disabled={uploading}>
						{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
						{uploading ? "Uploading APK..." : "Upload APK"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
