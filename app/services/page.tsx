"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Wrench,
  Shield,
  Cpu,
  Activity,
  Anchor,
  Ship,
  ArrowRight,
  Globe,
  Clock,
  CheckCircle2,
  Settings,
  AlertTriangle,
  Brain,
  BarChart,
} from "lucide-react"

const services = [
  {
    id: 1,
    icon: <Wrench className="w-6 h-6" />,
    title: "Preventive Maintenance",
    description: "Regular inspections and maintenance to prevent equipment failures and extend vessel life",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: 2,
    icon: <Shield className="w-6 h-6" />,
    title: "Emergency Repairs",
    description: "24/7 rapid response team for critical repairs and emergency situations",
    bgColor: "bg-red-50 dark:bg-red-950",
    iconColor: "text-red-600 dark:text-red-400",
  },
  {
    id: 3,
    icon: <Cpu className="w-6 h-6" />,
    title: "AI Diagnostics",
    description: "Advanced AI-powered system diagnostics and predictive maintenance",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    id: 4,
    icon: <Activity className="w-6 h-6" />,
    title: "Equipment Overhaul",
    description: "Complete equipment restoration and modernization services",
    bgColor: "bg-orange-50 dark:bg-orange-950",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    id: 5,
    icon: <Activity className="w-6 h-6" />,
    title: "Performance Analysis",
    description: "Detailed vessel performance monitoring and optimization recommendations",
    bgColor: "bg-green-50 dark:bg-green-950",
    iconColor: "text-green-600 dark:text-green-400",
  },
  {
    id: 6,
    icon: <Ship className="w-6 h-6" />,
    title: "Fleet Management",
    description: "Comprehensive fleet monitoring and management solutions",
    bgColor: "bg-teal-50 dark:bg-teal-950",
    iconColor: "text-teal-600 dark:text-teal-400",
  }
]

const features = [
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Global Coverage",
    description: "Service network spanning major maritime routes",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "24/7 Support",
    description: "Round-the-clock emergency response team",
  },
  {
    icon: <CheckCircle2 className="w-6 h-6" />,
    title: "Certified Experts",
    description: "Highly trained and certified technicians",
  },
]

const stats = [
  { value: "1+", label: "Years Experience" },
  { value: "2+", label: "Vessels Serviced" },
  { value: "24/7", label: "Support Available" },
  { value: "98%", label: "Client Satisfaction" },
]

export default function ServicesPage() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <MainLayout>
      {/* Hero Section */}
      <div ref={containerRef} className="relative h-[80vh] overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0">
          <Image
            src="/placeholder.svg"
            alt="Maritime Services"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
        </motion.div>
        
        <div className="relative container h-full flex items-center">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4">
              <Anchor className="w-4 h-4 mr-2" />
              Maritime Excellence
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Advanced Maritime
              <span className="text-primary"> Services</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              Comprehensive solutions for modern fleet maintenance and management
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-white/10 backdrop-blur-sm"
              >
                View Services
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="py-12 bg-primary">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center text-white">
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Overview Grid */}
      <section className="py-24">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-muted-foreground">
              Navigate to learn more about each of our specialized maritime services
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="group"
              >
                <Link href={`#${service.id === 1 ? "preventive" : 
                    service.id === 2 ? "emergency" :
                    service.id === 3 ? "diagnostics" :
                    service.id === 4 ? "overhaul" :
                    service.id === 5 ? "performance" :
                    "fleet"}`}>
                  <div className={`rounded-lg p-6 transition-all duration-300 ${service.bgColor} group-hover:scale-105`}>
                    <div className={`w-12 h-12 rounded-lg ${service.iconColor} flex items-center justify-center mb-4`}>
                      {service.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
                    <Button variant="outline" className="w-full">
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Individual Service Sections */}
      <section id="preventive" className="py-24 bg-blue-50 dark:bg-blue-950/30">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                <Wrench className="w-4 h-4 mr-2" />
                Preventive Maintenance
              </Badge>
              <h2 className="text-3xl font-bold mb-6">Keep Your Fleet in Prime Condition</h2>
              <p className="text-muted-foreground mb-6">
                Our preventive maintenance program is designed to catch potential issues before they become problems,
                ensuring your vessels operate at peak efficiency and reducing costly downtime.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Regular Inspections</h4>
                    <p className="text-muted-foreground">Thorough vessel inspections on a scheduled basis</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Scheduled Maintenance</h4>
                    <p className="text-muted-foreground">Proactive maintenance based on manufacturer specifications</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Component Lifecycle Tracking</h4>
                    <p className="text-muted-foreground">Detailed monitoring of equipment lifespan and wear</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/services/preventive-maintenance.jpg"
                alt="Ship maintenance crew performing routine inspection"
                width={600}
                height={400}
                className="rounded-lg shadow-xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="emergency" className="py-24 bg-red-50 dark:bg-red-950/30">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Image
                src="/services/emergency-repairs.jpg"
                alt="Emergency repair team working on ship equipment"
                width={600}
                height={400}
                className="rounded-lg shadow-xl object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <Badge variant="destructive" className="mb-4">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Emergency Repairs
              </Badge>
              <h2 className="text-3xl font-bold mb-6">24/7 Emergency Response</h2>
              <p className="text-muted-foreground mb-6">
                When the unexpected happens, our emergency response team is ready to deploy
                at a moment's notice, providing rapid repairs and solutions to keep your operations running.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-red-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Rapid Response Team</h4>
                    <p className="text-muted-foreground">Available 24/7 for immediate deployment</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-red-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Mobile Repair Units</h4>
                    <p className="text-muted-foreground">Fully equipped mobile workshops</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-red-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Global Coverage</h4>
                    <p className="text-muted-foreground">Support available at major ports worldwide</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="diagnostics" className="py-24 bg-purple-50 dark:bg-purple-950/30">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                <Brain className="w-4 h-4 mr-2" />
                AI Diagnostics
              </Badge>
              <h2 className="text-3xl font-bold mb-6">Smart Maritime Solutions</h2>
              <p className="text-muted-foreground mb-6">
                Leverage cutting-edge AI technology to predict and prevent equipment failures,
                optimize performance, and reduce operational costs.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-purple-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Predictive Analytics</h4>
                    <p className="text-muted-foreground">AI-powered failure prediction</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-purple-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Real-time Monitoring</h4>
                    <p className="text-muted-foreground">24/7 equipment health tracking</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-purple-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Smart Maintenance Scheduling</h4>
                    <p className="text-muted-foreground">AI-optimized maintenance planning</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/services/ai-diagnostics.jpg"
                alt="Advanced diagnostic equipment and monitoring screens"
                width={600}
                height={400}
                className="rounded-lg shadow-xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="overhaul" className="py-24 bg-orange-50 dark:bg-orange-950/30">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Image
                src="/services/equipment-overhaul.jpg"
                alt="Complete ship engine overhaul process"
                width={600}
                height={400}
                className="rounded-lg shadow-xl object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <Badge variant="secondary" className="mb-4">
                <Settings className="w-4 h-4 mr-2" />
                Equipment Overhaul
              </Badge>
              <h2 className="text-3xl font-bold mb-6">Complete System Restoration</h2>
              <p className="text-muted-foreground mb-6">
                Comprehensive equipment overhaul services to extend the life of your maritime assets
                and ensure optimal performance.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-orange-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Full System Assessment</h4>
                    <p className="text-muted-foreground">Detailed equipment evaluation</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-orange-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Component Replacement</h4>
                    <p className="text-muted-foreground">High-quality parts and components</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-orange-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Performance Testing</h4>
                    <p className="text-muted-foreground">Rigorous post-overhaul testing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="performance" className="py-24 bg-green-50 dark:bg-green-950/30">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                <BarChart className="w-4 h-4 mr-2" />
                Performance Analysis
              </Badge>
              <h2 className="text-3xl font-bold mb-6">Optimize Your Fleet Performance</h2>
              <p className="text-muted-foreground mb-6">
                Data-driven insights and analysis to help you make informed decisions
                and maximize your fleet's efficiency.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Performance Metrics</h4>
                    <p className="text-muted-foreground">Comprehensive data collection and analysis</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Efficiency Reports</h4>
                    <p className="text-muted-foreground">Detailed operational insights</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Optimization Recommendations</h4>
                    <p className="text-muted-foreground">Actionable improvement strategies</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/services/performance-analysis.jpg"
                alt="Digital dashboard showing ship performance metrics"
                width={600}
                height={400}
                className="rounded-lg shadow-xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="fleet" className="py-24 bg-teal-50 dark:bg-teal-950/30">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Image
                src="/services/fleet-management.jpg"
                alt="Modern fleet control room with multiple vessel tracking"
                width={600}
                height={400}
                className="rounded-lg shadow-xl object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <Badge variant="secondary" className="mb-4">
                <Ship className="w-4 h-4 mr-2" />
                Fleet Management
              </Badge>
              <h2 className="text-3xl font-bold mb-6">Comprehensive Fleet Solutions</h2>
              <p className="text-muted-foreground mb-6">
                End-to-end fleet management services to streamline operations and
                maximize the efficiency of your maritime assets.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-teal-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Fleet Tracking</h4>
                    <p className="text-muted-foreground">Real-time vessel monitoring</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-teal-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Resource Optimization</h4>
                    <p className="text-muted-foreground">Efficient resource allocation</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-teal-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Compliance Management</h4>
                    <p className="text-muted-foreground">Regulatory compliance tracking</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Optimize Your Fleet Operations?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Contact us today to discuss how our services can help maintain and
            improve your maritime operations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" variant="secondary">
              Get Started Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 hover:bg-white/20 border-white/20"
            >
              <Ship className="mr-2 h-5 w-5" />
              View Case Studies
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
