import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"
import { BarcodeFormat, DecodeHintType } from "@zxing/library"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Camera,
  Flashlight,
  FlashlightOff,
  FlipHorizontal,
  RefreshCw,
  Search,
  Upload,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const hints = new Map()
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
  BarcodeFormat.QR_CODE,
])

interface BarcodeScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (code: string) => void
  title?: string
}

export function BarcodeScannerDialog({
  open,
  onOpenChange,
  onScan,
  title,
}: BarcodeScannerDialogProps) {
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)

  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment")
  const [torchOn, setTorchOn] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)
  const [isLoadingCamera, setIsLoadingCamera] = useState(true)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState("")

  const stopScanner = () => {
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
  }

  const startScanner = async (facing: "environment" | "user" = cameraFacing) => {
    stopScanner()
    setIsLoadingCamera(true)
    setCameraError(null)

    // Give DOM a tick to ensure video element is rendered and sized
    await new Promise((resolve) => setTimeout(resolve, 150))

    if (!videoRef.current) {
      setIsLoadingCamera(false)
      return
    }

    const reader = new BrowserMultiFormatReader(hints)

    // Enumerate devices to pick the best rear/back camera on Android/iPhone
    let rearDeviceId: string | undefined = undefined
    try {
      if (navigator?.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((d) => d.kind === "videoinput")
        // Look for rear/back camera in labels
        const backCamera = videoDevices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment") ||
            d.label.toLowerCase().includes("0")
        )
        if (backCamera?.deviceId && facing === "environment") {
          rearDeviceId = backCamera.deviceId
        }
      }
    } catch {
      // Permission or enumeration fallback
    }

    // Progressive fallback constraints strongly prioritizing primary rear camera
    const constraintList: MediaStreamConstraints[] = [
      ...(rearDeviceId && facing === "environment"
        ? [
            {
              video: {
                deviceId: { exact: rearDeviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            },
          ]
        : []),
      {
        video: {
          facingMode: { exact: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      {
        video: {
          facingMode: facing,
        },
      },
      {
        video: true,
      },
    ]

    let started = false
    for (const constraints of constraintList) {
      try {
        const controls = await reader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result, err) => {
            if (result) {
              const text = result.getText().trim()
              if (text) {
                stopScanner()
                onScan(text)
              }
            }
          },
        )

        controlsRef.current = controls
        started = true
        setIsLoadingCamera(false)

        // Check torch support
        try {
          const stream = videoRef.current.srcObject as MediaStream | null
          const track = stream?.getVideoTracks()[0]
          const capabilities = (track as any)?.getCapabilities?.() || {}
          setHasTorch(Boolean(capabilities.torch))
        } catch {
          setHasTorch(false)
        }

        break
      } catch (err: any) {
        console.warn("Camera constraint attempt failed:", constraints, err)
      }
    }

    if (!started) {
      setIsLoadingCamera(false)
      setCameraError(
        "ক্যামেরা চালু করা সম্ভব হয়নি। ক্যামেরা পারমিশন চেক করুন অথবা নিচে বারকোড লিখে দিন।",
      )
    }
  }

  useEffect(() => {
    if (!open) {
      stopScanner()
      setManualCode("")
      setTorchOn(false)
      return
    }

    startScanner(cameraFacing)

    return () => {
      stopScanner()
    }
  }, [open, cameraFacing])

  const toggleTorch = async () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream | null
      const track = stream?.getVideoTracks()[0]
      if (track) {
        const nextState = !torchOn
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        })
        setTorchOn(nextState)
      }
    } catch (e) {
      console.error("Torch error", e)
      toast({ title: "ফ্ল্যাশলাইট চালু করা যায়নি", variant: "destructive" })
    }
  }

  const switchCamera = () => {
    setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"))
  }

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = manualCode.trim()
    if (!trimmed) {
      toast({ title: "বারকোড নাম্বার লিখুন", variant: "destructive" })
      return
    }
    stopScanner()
    onScan(trimmed)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const reader = new BrowserMultiFormatReader(hints)
      const imageUrl = URL.createObjectURL(file)
      const result = await reader.decodeFromImageUrl(imageUrl)
      URL.revokeObjectURL(imageUrl)

      if (result) {
        stopScanner()
        onScan(result.getText().trim())
        toast({ title: "ছবি থেকে বারকোড পাওয়া গেছে" })
      }
    } catch (err) {
      console.error("Image decode error", err)
      toast({
        title: "ছবিটিতে স্পষ্ট বারকোড পাওয়া যায়নি",
        description: "অনুগ্রহ করে পরিষ্কার ছবি দিন বা হাতে কোড লিখুন",
        variant: "destructive",
      })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl border-border bg-card">
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              {title || "বারকোড স্ক্যানার"}
            </DialogTitle>
            <Badge variant="outline" className="text-[11px] font-semibold">
              {cameraFacing === "environment" ? "ব্যাক ক্যামেরা" : "ফ্রন্ট ক্যামেরা"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-3">
          {/* Camera Viewport / Error State */}
          <div className="relative aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-border/60">
            {cameraError ? (
              <div className="p-6 text-center space-y-3">
                <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
                <p className="text-xs text-slate-300 leading-relaxed max-w-[260px] mx-auto">
                  {cameraError}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startScanner(cameraFacing)}
                  className="rounded-xl text-xs gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  পুনরায় চেষ্টা করুন
                </Button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  autoPlay
                />

                {/* Laser scan line & target reticle */}
                <div className="absolute inset-x-8 inset-y-6 border-2 border-primary/80 rounded-xl pointer-events-none z-10 shadow-[0_0_15px_rgba(234,88,12,0.3)]">
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-pulse relative top-1/2 -translate-y-1/2" />
                </div>

                {/* Controls overlay */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                  {hasTorch && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition-colors"
                      title="ফ্ল্যাশলাইট"
                    >
                      {torchOn ? (
                        <Flashlight className="h-4 w-4 text-amber-400" />
                      ) : (
                        <FlashlightOff className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={switchCamera}
                    className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition-colors"
                    title="ক্যামেরা পরিবর্তন করুন"
                  >
                    <FlipHorizontal className="h-4 w-4" />
                  </button>
                </div>

                {isLoadingCamera && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-2 z-30">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs">ক্যামেরা চালু হচ্ছে...</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick Fallback: Manual Barcode Input */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="বারকোড নাম্বার লিখুন..."
                  className="pl-9 h-11 rounded-xl text-sm font-mono"
                  autoFocus={Boolean(cameraError)}
                />
              </div>
              <Button type="submit" className="h-11 px-4 rounded-xl font-bold">
                খুঁজুন
              </Button>
            </div>
          </form>

          {/* Upload Image Option */}
          <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-primary hover:underline font-semibold"
            >
              <Upload className="h-3.5 w-3.5" />
              ছবি থেকে স্ক্যান করুন
            </button>
            <span>EAN, UPC, Code-128</span>
          </div>
        </div>

        <DialogFooter className="p-4 pt-0 border-t bg-muted/20 flex gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl h-10"
          >
            বাতিল
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
