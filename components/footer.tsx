import { Mail, MapPin, Phone } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-secondary/30 border-t border-border mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-primary mb-4 font-serif text-lg">SAUNDRYA CAKES</h3>
            <p className="text-muted-foreground text-sm">
              Freshly baked, beautifully crafted cakes for every occasion in Mumbai.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <Phone className="w-4 h-4 shrink-0 mt-0.5" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex gap-2">
                <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                <span>hello@sweetcakes.com</span>
              </div>
              <div className="flex gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Mumbai, Maharashtra</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Hours</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Monday - Friday: 10am - 8pm</p>
              <p>Saturday - Sunday: 10am - 9pm</p>
              <p className="pt-2 text-xs">Closed on public holidays</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>&copy; 2025 SAUNDRYA CAKES Mumbai. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Contact
            </a>
            <a
              href="https://razorpay.me/@sahilchangdevkapase"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Pay (Razorpay)
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
