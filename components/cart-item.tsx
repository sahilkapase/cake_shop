"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, Minus, Plus } from "lucide-react"

interface CartItemProps {
  id: string
  cakeName: string
  weight: string
  quantity: number
  pricePerUnit: number
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}

export function CartItem({ id, cakeName, weight, quantity, pricePerUnit, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold">{cakeName}</h3>
          <p className="text-sm text-muted-foreground">{weight}</p>
          <p className="text-sm font-semibold mt-2">₹{pricePerUnit} each</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-border rounded-lg p-1">
            <Button variant="ghost" size="sm" onClick={() => onUpdateQuantity(id, Math.max(1, quantity - 1))}>
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-6 text-center text-sm">{quantity}</span>
            <Button variant="ghost" size="sm" onClick={() => onUpdateQuantity(id, quantity + 1)}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-end mt-3 pt-3 border-t border-border">
        <span className="font-bold">₹{pricePerUnit * quantity}</span>
      </div>
    </Card>
  )
}
