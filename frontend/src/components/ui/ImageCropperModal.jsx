import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X, Check } from 'lucide-react'
import getCroppedImg from '@/lib/cropUtils'
import { useTranslation } from 'react-i18next'

export function ImageCropperModal({ imageSrc, onComplete, onClose, aspect = 3 / 4 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const { t } = useTranslation()

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setIsProcessing(true)
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      onComplete(croppedBlob)
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card w-full max-w-md rounded-[2rem] shadow-2xl border border-border overflow-hidden flex flex-col h-[70vh] sm:h-[600px]"
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold">{t('cropper.title')}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="relative flex-1 w-full bg-black/5">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            showGrid={false}
          />
        </div>

        <div className="p-6 shrink-0 border-t border-border bg-card">
          <div className="mb-6 flex items-center gap-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase">{t('cropper.zoom')}</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(e.target.value)}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl">
              {t('cropper.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isProcessing} className="flex-1 h-12 rounded-xl">
              {isProcessing ? t('cropper.processing') : <><Check className="w-4 h-4 mr-2" /> {t('cropper.apply')}</>}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}