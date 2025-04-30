import { supabase } from "@/lib/supabase/client"
import { v4 as uuidv4 } from "uuid"
import { getSupabaseServer } from "@/lib/supabase/server"

export type FileUploadResult = {
  path: string
  url: string | null
  error: string | null
}

// Client-side file upload function
export async function uploadTradeScreenshot(
  file: File,
  tradeId: string,
  type: "screenshot" | "chart" | "annotation" = "screenshot",
): Promise<FileUploadResult> {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `trades/${tradeId}/${type}/${fileName}`

    const { error: uploadError } = await supabase.storage.from("trade-screenshots").upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from("trade-screenshots").getPublicUrl(filePath)

    return {
      path: filePath,
      url: data.publicUrl,
      error: null,
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    return {
      path: "",
      url: null,
      error: error instanceof Error ? error.message : "Unknown error during file upload",
    }
  }
}

// Function to generate a signed URL for private files (server-side)
export async function getSignedImageUrl(path: string, expiresIn = 3600): Promise<string | null> {
  try {
    // Use server-side client for admin operations
    const supabaseServer = getSupabaseServer()

    const { data, error } = await supabaseServer.storage.from("trade-screenshots").createSignedUrl(path, expiresIn)

    if (error) {
      throw error
    }

    return data.signedUrl
  } catch (error) {
    console.error("Error generating signed URL:", error)
    return null
  }
}

// Delete a file from storage
export async function deleteTradeScreenshot(path: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.storage.from("trade-screenshots").remove([path])

    if (error) {
      throw error
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error deleting file:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during file deletion",
    }
  }
}

// Helper function to list files in a directory
export async function listTradeScreenshots(
  tradeId: string,
  type?: "screenshot" | "chart" | "annotation",
): Promise<{ files: string[]; error: string | null }> {
  try {
    const path = type ? `trades/${tradeId}/${type}` : `trades/${tradeId}`

    const { data, error } = await supabase.storage.from("trade-screenshots").list(path)

    if (error) {
      throw error
    }

    return {
      files: data.map((file) => `${path}/${file.name}`),
      error: null,
    }
  } catch (error) {
    console.error("Error listing files:", error)
    return {
      files: [],
      error: error instanceof Error ? error.message : "Unknown error listing files",
    }
  }
}
