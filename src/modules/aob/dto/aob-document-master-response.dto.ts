export interface AobDocumentMasterResponseDto {
  _id: string;
  documentName: string;
  documentType: string;
  documentDescription: string;
  documentInstruction: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}
