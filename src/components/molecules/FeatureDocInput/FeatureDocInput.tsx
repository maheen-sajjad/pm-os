"use client";

import { useState, useRef, useCallback } from "react";
import { Input } from "@/atoms/Input";
import { Textarea } from "@/atoms/Textarea";
import { Button } from "@/atoms/Button";
import { Card, CardBody } from "@/atoms/Card";
import { cn } from "@/utils/cn";
import type { FeatureDocInputProps, UploadedFile, ParseDocumentResponse } from "./FeatureDocInput.types";

const ACCEPTED_FILE_TYPES = ".pdf,.docx,.txt,.md,.markdown";
const MAX_FILE_SIZE_MB = 10;

export function FeatureDocInput({
  value,
  onChange,
  featureName,
  onFeatureNameChange,
  onSubmit,
  isLoading = false,
}: FeatureDocInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      return;
    }

    // Validate file type
    const extension = file.name.split(".").pop()?.toLowerCase();
    const validExtensions = ["pdf", "docx", "txt", "md", "markdown"];
    if (!extension || !validExtensions.includes(extension)) {
      setUploadError("Unsupported file type. Please use PDF, DOCX, TXT, or MD files.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents/parse", {
        method: "POST",
        body: formData,
      });

      const data: ParseDocumentResponse | { error: string } = await response.json();

      if (!response.ok) {
        throw new Error((data as { error: string }).error || "Failed to parse document");
      }

      const result = data as ParseDocumentResponse;
      onChange(result.text);
      setUploadedFile({
        name: result.fileName,
        type: result.fileType,
        characterCount: result.characterCount,
      });

      // Auto-fill feature name from filename if empty
      if (!featureName) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        const cleanName = nameWithoutExt
          .replace(/[-_]/g, " ")
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .trim();
        onFeatureNameChange(cleanName);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Failed to process file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        await processFile(files[0]);
      }
    },
    [onChange, featureName, onFeatureNameChange]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setUploadError(null);
    onChange("");
  };

  return (
    <Card variant="default" padding="lg">
      <CardBody className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="feature-name"
            className="block text-sm font-medium text-secondary-700"
          >
            Feature Name
          </label>
          <Input
            id="feature-name"
            placeholder="e.g., User Authentication System"
            value={featureName}
            onChange={(e) => onFeatureNameChange(e.target.value)}
          />
        </div>

        {/* File Upload Zone */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-700">
            Upload Document or Paste Content
          </label>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-lg p-6 transition-colors",
              isDragging
                ? "border-primary-500 bg-primary-50"
                : "border-secondary-300 hover:border-secondary-400",
              isUploading && "opacity-50 pointer-events-none"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="text-center">
              <div className="mb-3">
                <svg
                  className={cn(
                    "mx-auto h-12 w-12",
                    isDragging ? "text-primary-500" : "text-secondary-400"
                  )}
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-primary-500" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-secondary-600">Processing document...</span>
                </div>
              ) : (
                <>
                  <p className="text-secondary-600">
                    <button
                      type="button"
                      onClick={handleBrowseClick}
                      className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:underline"
                    >
                      Upload a file
                    </button>
                    {" "}or drag and drop
                  </p>
                  <p className="text-sm text-secondary-500 mt-1">
                    PDF, DOCX, TXT, MD up to {MAX_FILE_SIZE_MB}MB
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Upload Error */}
          {uploadError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {uploadError}
            </div>
          )}

          {/* Uploaded File Badge */}
          {uploadedFile && (
            <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-md">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">{uploadedFile.name}</span>
                <span className="text-green-600">
                  ({uploadedFile.characterCount.toLocaleString()} chars)
                </span>
              </div>
              <button
                type="button"
                onClick={clearUploadedFile}
                className="text-green-600 hover:text-green-800 p-1"
                title="Clear uploaded file"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-secondary-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-secondary-500">or paste directly</span>
          </div>
        </div>

        {/* Textarea */}
        <div className="space-y-2">
          <label
            htmlFor="feature-doc"
            className="block text-sm font-medium text-secondary-700"
          >
            Feature doc, PRD, or requirements
          </label>
          <Textarea
            id="feature-doc"
            placeholder="Describe your feature requirements here...

Example:
Users should be able to sign up with email and password.
They need to verify their email before accessing the app.
Password reset via email link. Session expires in 24h.
Support OAuth with Google and GitHub."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={12}
            resize="vertical"
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={onSubmit}
            disabled={!value.trim() || !featureName.trim() || isLoading || isUploading}
            isLoading={isLoading}
          >
            Generate Board
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}