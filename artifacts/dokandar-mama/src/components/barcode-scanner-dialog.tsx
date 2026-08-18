import { useEffect, useRef } from "react"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"
import { BarcodeFormat, DecodeHintType } from "@zxing/library"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

// Restricting to the barcode formats shops actually use (not QR/PDF417/etc.)
// cuts decode work per frame significantly — this is most of the "scanner
// feels slow" fix, on top of the camera selection below.
const hints = new Map()
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
])

interface BarcodeScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (code: string) => void
  title?: string
}

export function BarcodeScannerDialog({ open, onOpenChange, onScan, title }: BarcodeScannerDialogProps) {
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    const start = async () => {
      try {
        // facingMode: "environment" asks the OS for the phone's primary
        // rear lens directly, instead of guessing from an enumerated
        // device list (which previously sometimes picked a secondary/wide
        // lens depending on device ordering). It also focuses faster than
        // whatever camera happens to be selected by index.
        const reader = new BrowserMultiFormatReader(hints)
        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current!,
          (result) => {
            if (result && !cancelled) {
              onScan(result.getText())
            }
          },
        )
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          toast({ title: "ক্যামেরা চালু করতে সমস্যা হয়েছে", variant: "destructive" })
          onOpenChange(false)
        }
      }
    }

    start()

    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title || "বারকোড স্ক্যান করুন"}</DialogTitle>
        </DialogHeader>
        {/* Rectangular (not square) frame — matches the shape of real barcodes */}
        <div className="aspect-[16/10] bg-black rounded-lg overflow-hidden relative">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
          <div className="absolute inset-x-6 inset-y-8 border-2 border-primary/70 rounded-md pointer-events-none z-10" />
        </div>
        <Button variant="outline" onClick={() => onOpenChange(false)}>বাতিল করুন</Button>
      </DialogContent>
    </Dialog>
  )
}
