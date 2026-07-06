import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase/firebaseService";

export interface AttachmentMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  downloadURL: string;
  storagePath: string;
  uploadedAt: string;
}

export const attachmentService = {
  /**
   * Uploads a file to Firebase Storage under the specific event workspace.
   */
  uploadAttachment: (
    uid: string,
    eventId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<AttachmentMetadata> => {
    return new Promise((resolve, reject) => {
      // Create a unique file name to avoid collisions
      const fileExt = file.name.split('.').pop();
      const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15);
      
      const fileName = `${uniqueId}.${fileExt}`;
      const storagePath = `users/${uid}/events/${eventId}/attachments/${fileName}`;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            const metadata: AttachmentMetadata = {
              id: uniqueId,
              name: file.name,
              type: file.type,
              size: file.size,
              downloadURL,
              storagePath,
              uploadedAt: new Date().toISOString()
            };
            
            resolve(metadata);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  },

  /**
   * Deletes a file from Firebase Storage.
   */
  deleteAttachment: async (storagePath: string): Promise<void> => {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      throw error;
    }
  }
};
