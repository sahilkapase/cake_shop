"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  life: number
  maxLife: number
  size: number
  type: "flower" | "confetti"
  color: string
}

export function ConfettiAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = [
      "#FF69B4", // Hot Pink
      "#FFB6C1", // Light Pink
      "#FFC0CB", // Pink
      "#FF1493", // Deep Pink
      "#DB7093", // Pale Violet Red
      "#FFD700", // Gold
      "#FFA500", // Orange
      "#FF69B4", // Hot Pink again for more frequency
    ]

    const flowerEmojis = ["🌸", "🌺", "🌼", "🌻", "🌷", "🥀", "💐", "✨"]

    // Create initial burst of particles
    const createBurst = () => {
      const burstCount = 80
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      for (let i = 0; i < burstCount; i++) {
        const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.4
        const speed = 5 + Math.random() * 8
        const isFlower = Math.random() > 0.5

        particlesRef.current.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.15,
          life: 0,
          maxLife: 2.5 + Math.random() * 1.5,
          size: isFlower ? 20 + Math.random() * 15 : 6 + Math.random() * 4,
          type: isFlower ? "flower" : "confetti",
          color: colors[Math.floor(Math.random() * colors.length)],
        })
      }

      // Create secondary wave with more flowers
      setTimeout(() => {
        const secondWaveCount = 50
        for (let i = 0; i < secondWaveCount; i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 2 + Math.random() * 5
          particlesRef.current.push({
            x: centerX + (Math.random() - 0.5) * 100,
            y: centerY + (Math.random() - 0.5) * 100,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            life: 0,
            maxLife: 3 + Math.random() * 2,
            size: 18 + Math.random() * 18,
            type: "flower",
            color: colors[Math.floor(Math.random() * colors.length)],
          })
        }
      }, 300)
    }

    const animate = () => {
      // Clear canvas with slight trail effect
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.life += 1 / 60

        // Gravity
        particle.vy += 0.15

        // Air resistance
        particle.vx *= 0.98
        particle.vy *= 0.98

        // Update position
        particle.x += particle.vx
        particle.y += particle.vy
        particle.rotation += particle.rotationSpeed

        // Calculate life progress (0 to 1)
        const progress = particle.life / particle.maxLife
        const alpha = Math.max(0, 1 - progress)

        if (particle.type === "flower") {
          // Draw flower emoji
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.translate(particle.x, particle.y)
          ctx.rotate(particle.rotation)
          ctx.font = `${particle.size}px Arial`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          const emoji = flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)]
          ctx.fillText(emoji, 0, 0)
          ctx.restore()
        } else {
          // Draw confetti rectangle
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.translate(particle.x, particle.y)
          ctx.rotate(particle.rotation)
          ctx.fillStyle = particle.color
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size)
          ctx.restore()
        }

        // Keep particle if still alive
        return particle.life < particle.maxLife
      })

      // Continue animation if particles remain or continue for a while
      if (particlesRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    // Start animation
    createBurst()
    animate()

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ display: "block" }}
    />
  )
}
