import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  type ChotuConfig,
  type ChotuOutfit,
  type ChotuPersonality,
  type ChotuSize,
  type ChotuAnimationIntensity,
  type ChotuLanguage,
  type ChotuState,
  DEFAULT_CHOTU_CONFIG,
  OUTFIT_OPTIONS,
  PERSONALITY_OPTIONS,
  COLOR_PRESETS,
  saveChotuConfig,
} from "@/lib/chotu-config"
import { ChotuAvatar } from "./chotu-avatar"
import { Sparkles, Palette, User, Volume2, Wand2, RefreshCw } from "lucide-react"

interface ChotuCustomizerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentConfig: ChotuConfig
  onConfigChange: (newConfig: ChotuConfig) => void
}

export function ChotuCustomizerDialog({
  open,
  onOpenChange,
  currentConfig,
  onConfigChange,
}: ChotuCustomizerDialogProps) {
  const { toast } = useToast()
  const [draftConfig, setDraftConfig] = useState<ChotuConfig>({ ...currentConfig })
  const [previewState, setPreviewState] = useState<ChotuState>("idle")

  const handleSave = () => {
    saveChotuConfig(draftConfig)
    onConfigChange(draftConfig)
    toast({
      title: "✓ ছোটু আপডেট হয়েছে!",
      description: "আপনার পছন্দের ছোটু এখন সবসময় দোকানে সঙ্গ দিবে।",
    })
    onOpenChange(false)
  }

  const handleReset = () => {
    setDraftConfig(DEFAULT_CHOTU_CONFIG)
    saveChotuConfig(DEFAULT_CHOTU_CONFIG)
    onConfigChange(DEFAULT_CHOTU_CONFIG)
    toast({ title: "ডিফল্ট ছোটু সেট করা হয়েছে" })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-border bg-card">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                <Wand2 className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">ছোটুকে সাজান (Customize Chotu)</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  দোকানদার মামার পার্সোনাল এআই সহকারীর লুক ও চরিত্র পরিবর্তন করুন
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              AI Buddy
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Top: Live Interactive Character Preview Stage */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-gradient-to-br from-primary/5 via-sky-500/5 to-amber-500/5 border border-border">
            <div className="flex flex-col items-center justify-center p-3 bg-background/80 rounded-2xl shadow-sm border shrink-0">
              <ChotuAvatar
                config={draftConfig}
                state={previewState}
                className="transition-all"
              />
              <span className="text-[11px] font-semibold text-muted-foreground mt-2">
                লাইভ প্রিভিউ
              </span>
            </div>

            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h4 className="text-base font-bold text-foreground">
                    দেশি এআই ছোটু
                  </h4>
                  <Badge className="bg-blue-600 text-white text-[10px]">
                    JARVIS Vibe
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  "{draftConfig.customGreeting || "কি লাগবে মামা? বলুন, আমি আছি!"}"
                </p>
              </div>

              {/* State Tester Buttons */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  মুড ও স্টেট টেস্ট করুন:
                </span>
                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                  {(["idle", "listening", "thinking", "speaking", "success"] as ChotuState[]).map(
                    (st) => (
                      <Button
                        key={st}
                        type="button"
                        size="sm"
                        variant={previewState === st ? "default" : "outline"}
                        className="h-7 text-xs rounded-lg px-2.5 capitalize"
                        onClick={() => setPreviewState(st)}
                      >
                        {st === "idle" && "শান্ত"}
                        {st === "listening" && "শুনছে 🎧"}
                        {st === "thinking" && "ভাবছে 💭"}
                        {st === "speaking" && "বলছে 🗣️"}
                        {st === "success" && "খুশি 🎉"}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Customization Tabs */}
          <Tabs defaultValue="outfit" className="w-full">
            <TabsList className="grid grid-cols-4 h-11 rounded-xl p-1 bg-muted/60">
              <TabsTrigger value="outfit" className="rounded-lg text-xs font-bold gap-1">
                <Palette className="h-3.5 w-3.5" /> পোশাক
              </TabsTrigger>
              <TabsTrigger value="personality" className="rounded-lg text-xs font-bold gap-1">
                <User className="h-3.5 w-3.5" /> চরিত্র
              </TabsTrigger>
              <TabsTrigger value="voice" className="rounded-lg text-xs font-bold gap-1">
                <Volume2 className="h-3.5 w-3.5" /> ভাষা ও ভয়েস
              </TabsTrigger>
              <TabsTrigger value="display" className="rounded-lg text-xs font-bold gap-1">
                <Sparkles className="h-3.5 w-3.5" /> ডিসপ্লে
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Outfits & Colors */}
            <TabsContent value="outfit" className="space-y-5 pt-4">
              <div className="space-y-3">
                <Label className="text-sm font-bold">পোশাক ও থিম নির্বাচন করুন</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {OUTFIT_OPTIONS.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() =>
                        setDraftConfig((prev) => ({ ...prev, outfit: opt.id as ChotuOutfit }))
                      }
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                        draftConfig.outfit === opt.id
                          ? "border-primary bg-primary/5 shadow-sm scale-[1.02]"
                          : "border-border hover:border-muted-foreground/30 bg-card"
                      }`}
                    >
                      <div className="font-bold text-xs leading-snug">{opt.nameBn}</div>
                      <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                        {opt.descBn}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Palettes */}
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-bold">ক্যাপ ও ভেস্টের কালার কম্বিনেশন</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          capColor: preset.cap,
                          vestColor: preset.vest,
                        }))
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        draftConfig.capColor === preset.cap
                          ? "border-primary ring-2 ring-primary/20 bg-muted"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: preset.cap }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 -ml-2"
                        style={{ backgroundColor: preset.vest }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Personality */}
            <TabsContent value="personality" className="space-y-4 pt-4">
              <Label className="text-sm font-bold">ছোটুর ব্যক্তিত্ব (Personality Mode)</Label>
              <div className="space-y-2.5">
                {PERSONALITY_OPTIONS.map((pers) => (
                  <div
                    key={pers.id}
                    onClick={() =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        personality: pers.id as ChotuPersonality,
                      }))
                    }
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      draftConfig.personality === pers.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-muted-foreground/30 bg-card"
                    }`}
                  >
                    <span className="text-2xl mt-0.5">{pers.icon}</span>
                    <div className="flex-1 space-y-1">
                      <div className="font-bold text-sm text-foreground">{pers.nameBn}</div>
                      <p className="text-xs text-muted-foreground">{pers.descBn}</p>
                      <div className="text-xs text-primary font-medium italic mt-1">
                        "{pers.samplePhrase}"
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* TAB 3: Voice & Language */}
            <TabsContent value="voice" className="space-y-5 pt-4">
              <div className="space-y-3">
                <Label className="text-sm font-bold">ভাষা নির্বাচন</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "bn", label: "বাংলা (Bangla)", icon: "🇧🇩" },
                    { id: "banglish", label: "বাংলিশ (Banglish)", icon: "🗣️" },
                    { id: "en", label: "English", icon: "🌐" },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() =>
                        setDraftConfig((prev) => ({ ...prev, language: lang.id as ChotuLanguage }))
                      }
                      className={`p-3 rounded-2xl border-2 text-center transition-all ${
                        draftConfig.language === lang.id
                          ? "border-primary bg-primary/5 font-bold text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="text-xl mb-1">{lang.icon}</div>
                      <div className="text-xs">{lang.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">কাস্টম স্বাগতম বার্তা (Custom Greeting)</Label>
                <Input
                  value={draftConfig.customGreeting || ""}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({ ...prev, customGreeting: e.target.value }))
                  }
                  placeholder="যেমন: কি লাগবে মামা? বলুন, আমি আছি!"
                  className="h-11 rounded-xl"
                />
              </div>
            </TabsContent>

            {/* TAB 4: Display & Size */}
            <TabsContent value="display" className="space-y-5 pt-4">
              <div className="space-y-3">
                <Label className="text-sm font-bold">সাইজ নির্বাচন করুন</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "small", label: "ছোট (Small)", size: "48px" },
                    { id: "medium", label: "মাঝারি (Medium)", size: "68px" },
                    { id: "large", label: "বড় (Large)", size: "92px" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        setDraftConfig((prev) => ({ ...prev, size: s.id as ChotuSize }))
                      }
                      className={`p-3 rounded-2xl border-2 text-center transition-all ${
                        draftConfig.size === s.id
                          ? "border-primary bg-primary/5 font-bold text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="text-xs font-bold">{s.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{s.size}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold">অ্যানিমেশন তীব্রতা</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "minimal", label: "মৃদু (Minimal)" },
                    { id: "normal", label: "স্বাভাবিক (Normal)" },
                    { id: "expressive", label: "উজ্জ্বল (Expressive)" },
                  ].map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() =>
                        setDraftConfig((prev) => ({
                          ...prev,
                          animationIntensity: a.id as ChotuAnimationIntensity,
                        }))
                      }
                      className={`p-2.5 rounded-xl border-2 text-xs transition-all ${
                        draftConfig.animationIntensity === a.id
                          ? "border-primary bg-primary/5 font-bold text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> ডিফল্ট
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-10 text-xs"
            >
              বাতিল
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="rounded-xl h-10 px-5 text-xs font-bold"
            >
              সেভ করুন
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
