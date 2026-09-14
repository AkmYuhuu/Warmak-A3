"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UploadButton } from "@/lib/uploadthing";

type ImageUploaderProps = {
  onUploaded?: (url: string) => void;
};

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "success"; url: string } | { kind: "error"; message: string };

export default function ImageUploader({ onUploaded }: ImageUploaderProps) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  return (
    <div className="space-y-2">
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={async (res) => {
          const url = res[0]?.ufsUrl;
          if (typeof url !== "string" || url.length === 0) {
            setStatus({ kind: "error", message: "Upload selesai tapi URL kosong." });
            return;
          }
          setStatus({ kind: "saving" });
          try {
            await addDoc(collection(db, "posts"), {
              imageUrl: url,
              createdAt: serverTimestamp(),
            });
            setStatus({ kind: "success", url });
            onUploaded?.(url);
          } catch (err) {
            setStatus({
              kind: "error",
              message: err instanceof Error ? err.message : "Gagal menyimpan ke Firestore.",
            });
          }
        }}
        onUploadError={(err) => {
          setStatus({ kind: "error", message: err.message || "Upload gagal." });
        }}
      />
      {status.kind === "saving" && <p className="text-sm">Menyimpan ke Firestore…</p>}
      {status.kind === "success" && (
        <p className="text-sm text-green-600">Tersimpan: {status.url}</p>
      )}
      {status.kind === "error" && <p className="text-sm text-red-600">{status.message}</p>}
    </div>
  );
}
