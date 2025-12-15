export interface FeatureDocInputProps {
  value: string;
  onChange: (value: string) => void;
  featureName: string;
  onFeatureNameChange: (name: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export interface UploadedFile {
  name: string;
  type: string;
  characterCount: number;
}

export interface ParseDocumentResponse {
  text: string;
  fileName: string;
  fileType: string;
  characterCount: number;
}