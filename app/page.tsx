"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MainLayout } from "@/components/layout/main-layout"
import {
  Anchor,
  ArrowRight,
  MessageSquare,
  PenToolIcon as Tool,
  Shield,
  Wrench,
  BarChart,
  Ship,
  Waves,
  Cpu,
} from "lucide-react"

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const services = [
  {
    icon: <Tool className="h-6 w-6 text-primary" />,
    title: "Preventive Maintenance",
    description: "Regular inspections and maintenance to prevent costly breakdowns and extend vessel lifespan.",
    link: "/services#preventive",
  },
  {
    icon: <Shield className="h-6 w-6 text-primary" />,
    title: "Emergency Repairs",
    description: "24/7 emergency response for critical situations with rapid deployment of expert technicians.",
    link: "/services#emergency",
  },
  {
    icon: <Cpu className="h-6 w-6 text-primary" />,
    title: "AI Diagnostics",
    description: "Advanced AI-powered diagnostic solutions to detect potential issues before they become problems.",
    link: "/services#diagnostics",
  },
  {
    icon: <Wrench className="h-6 w-6 text-primary" />,
    title: "Equipment Overhaul",
    description: "Complete overhaul and refurbishment of marine equipment to extend service life.",
    link: "/services#overhaul",
  },
  {
    icon: <BarChart className="h-6 w-6 text-primary" />,
    title: "Performance Analysis",
    description: "Detailed analysis of vessel performance to optimize efficiency and reduce operational costs.",
    link: "/services#performance",
  },
  {
    icon: <Ship className="h-6 w-6 text-primary" />,
    title: "Fleet Management",
    description: "Comprehensive fleet management solutions to maintain optimal operation of multiple vessels.",
    link: "/services#fleet",
  },
]

const stats = [
  { value: "1+", label: "Years Experience" },
  { value: "2+", label: "Vessels Serviced" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "24/7", label: "Support Available" },
]

export default function Home() {
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [statsRef, statsInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [servicesRef, servicesInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden" ref={heroRef}>
        {/* Animated background - Enhanced contrast */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
          <div className="absolute inset-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }} // Increased opacity for better visibility
              transition={{ duration: 2 }}
              className="absolute inset-0"
            >
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
              >
                <motion.path
                  d="M0,50 Q25,30 50,50 Q75,70 100,50 L100,100 L0,100 Z"
                  fill="currentColor"
                  className="text-primary/40" // Increased opacity for better contrast
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "mirror",
                    duration: 10,
                    ease: "easeInOut",
                  }}
                />
                <motion.path
                  d="M0,60 Q25,80 50,60 Q75,40 100,60 L100,100 L0,100 Z"
                  fill="currentColor"
                  className="text-primary/30" // Increased opacity for better contrast
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "mirror",
                    duration: 15,
                    ease: "easeInOut",
                  }}
                />
                {/* Added a third wave for more visual impact */}
                <motion.path
                  d="M0,70 Q35,50 65,70 Q85,80 100,70 L100,100 L0,100 Z"
                  fill="currentColor"
                  className="text-primary/20"
                  initial={{ y: 10 }}
                  animate={{ y: -10 }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "mirror",
                    duration: 12,
                    ease: "easeInOut",
                  }}
                />
              </svg>
            </motion.div>
          </div>
        </div>

        <div className="container px-4 py-24 md:py-32 lg:py-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate={heroInView ? "visible" : "hidden"} variants={staggerContainer}>
              <motion.div variants={fadeIn} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 mb-4"
                >
                  <Waves className="mr-1 h-3.5 w-3.5" />
                  <span>Maritime Excellence</span>
                </motion.div>

                <motion.h1
                  variants={fadeIn}
                  className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
                >
                  <span className="block">Advanced Ship</span>
                  <span className="block text-primary">Maintenance Solutions</span>
                </motion.h1>

                <motion.p variants={fadeIn} className="max-w-lg text-lg text-muted-foreground md:text-xl">
                  Keeping your fleet in optimal condition with cutting-edge technology and decades of maritime
                  expertise.
                </motion.p>

                <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="/services">
                    <Button size="lg" className="w-full sm:w-auto group">
                      Explore Services
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/chat">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      AI Diagnostic Chat
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={heroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative h-[300px] md:h-[400px] lg:h-[500px] rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src="/placeholder.svg?height=1000&width=1500"
                  alt="Ship maintenance"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <span className="text-white font-medium">Expert maintenance for all vessel types</span>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute -top-6 -right-6 bg-background rounded-lg shadow-lg p-4 border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">ISO Certified</p>
                    <p className="text-sm text-muted-foreground">Quality Assured</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute -bottom-6 -left-6 bg-background rounded-lg shadow-lg p-4 border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Anchor className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">24/7 Support</p>
                    <p className="text-sm text-muted-foreground">Always Available</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50" ref={statsRef}>
        <div className="container px-4">
          <motion.div
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={fadeIn} className="text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={statsInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-4xl md:text-5xl font-bold text-primary mb-2"
                >
                  {stat.value}
                </motion.div>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24" ref={servicesRef}>
        <div className="container px-4">
          <motion.div
            initial="hidden"
            animate={servicesInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeIn} className="text-3xl font-bold mb-4">
              Our Comprehensive Services
            </motion.h2>
            <motion.p variants={fadeIn} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tailored maintenance solutions to keep your vessels operating at peak performance
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={servicesInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {services.map((service, index) => (
              <motion.div key={index} variants={fadeIn} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      {service.icon}
                    </div>
                    <CardTitle>{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Link href={service.link}>
                      <Button variant="outline" size="sm" className="group">
                        Learn More
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/30" ref={ctaRef}>
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8 }}
            className="bg-primary rounded-2xl p-8 md:p-12 overflow-hidden relative"
          >
            {/* Animated background elements - Enhanced contrast */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }} // Increased opacity for better visibility
              transition={{ duration: 1 }}
              className="absolute inset-0 pointer-events-none"
            >
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 50,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                className="absolute -right-40 -top-40 w-80 h-80 border-[30px] border-white/30 rounded-full" // Increased opacity
              />
              <motion.div
                animate={{
                  rotate: [360, 0],
                }}
                transition={{
                  duration: 30,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                className="absolute -left-20 -bottom-20 w-60 h-60 border-[20px] border-white/20 rounded-full" // Increased opacity
              />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
              <div>
                <h2 className="text-3xl font-bold text-primary-foreground mb-4">
                  Ready to optimize your fleet maintenance?
                </h2>
                <p className="mb-6 text-primary-foreground/90">
                  Our team of experts is ready to help you keep your vessels in top condition. Contact us today for a
                  consultation.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/contact">
                    <Button variant="secondary" size="lg">
                      Contact Us Today
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    View Case Studies
                  </Button>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[300px] h-[200px]">
                  <Image
                    src="/placeholder.svg?height=400&width=600"
                    alt="Ship maintenance team"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  )
}
