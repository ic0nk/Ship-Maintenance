"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Card, CardContent } from "@/components/ui/card"
import { MainLayout } from "@/components/layout/main-layout"
import { Anchor, Award, Clock, Users, Zap, Globe } from "lucide-react"

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

export default function AboutPage() {
  const [missionRef, missionInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [valuesRef, valuesInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [teamRef, teamInView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <MainLayout>
      {/* Header Banner */}
      <div className="relative h-[300px] md:h-[400px] lg:h-[500px]">
        <Image src="/placeholder.svg?height=1000&width=2000" alt="Ship at sea" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent flex items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="container px-4"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">About MarineTech</h1>
            <p className="text-xl max-w-2xl text-white/90">
              Leading the maritime industry with innovative maintenance solutions since 1998
            </p>
          </motion.div>
        </div>
      </div>

      {/* Mission Section */}
      <section className="py-24" ref={missionRef}>
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate={missionInView ? "visible" : "hidden"} variants={staggerContainer}>
              <motion.h2 variants={fadeIn} className="text-3xl font-bold mb-6">
                Our Mission
              </motion.h2>
              <motion.p variants={fadeIn} className="text-lg mb-6 text-muted-foreground">
                At MarineTech, our mission is to revolutionize ship maintenance through innovative technology and
                exceptional service. We strive to keep vessels operating at peak performance while minimizing downtime
                and costs.
              </motion.p>
              <motion.p variants={fadeIn} className="text-lg text-muted-foreground">
                We believe that preventive maintenance and early problem detection are key to extending the lifespan of
                maritime assets and ensuring safety at sea.
              </motion.p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={missionInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden shadow-xl">
                <Image
                  src="/placeholder.svg?height=800&width=1200"
                  alt="Ship maintenance team"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <span className="text-white font-medium">Our expert team at work</span>
                </div>
              </div>

              {/* Decorative element */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/10 rounded-lg -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-muted/30" ref={valuesRef}>
        <div className="container px-4">
          <motion.div
            initial="hidden"
            animate={valuesInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeIn} className="text-3xl font-bold mb-4">
              Our Core Values
            </motion.h2>
            <motion.p variants={fadeIn} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These principles guide everything we do at MarineTech
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={valuesInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <Award className="h-6 w-6 text-primary" />,
                title: "Excellence",
                description:
                  "We strive for excellence in every aspect of our service, from routine maintenance to complex repairs.",
              },
              {
                icon: <Users className="h-6 w-6 text-primary" />,
                title: "Collaboration",
                description:
                  "We work closely with our clients to understand their unique needs and develop tailored solutions.",
              },
              {
                icon: <Anchor className="h-6 w-6 text-primary" />,
                title: "Reliability",
                description:
                  "Our clients depend on us to keep their vessels operational, and we take that responsibility seriously.",
              },
              {
                icon: <Clock className="h-6 w-6 text-primary" />,
                title: "Efficiency",
                description: "We optimize maintenance processes to minimize downtime and maximize vessel availability.",
              },
              {
                icon: <Zap className="h-6 w-6 text-primary" />,
                title: "Innovation",
                description:
                  "We continuously seek new technologies and methodologies to improve our maintenance solutions.",
              },
              {
                icon: <Globe className="h-6 w-6 text-primary" />,
                title: "Sustainability",
                description:
                  "We are committed to environmentally responsible practices in all our maintenance operations.",
              },
            ].map((value, index) => (
              <motion.div key={index} variants={fadeIn} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                <Card className="h-full transition-all hover:shadow-md overflow-hidden">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24" id="team" ref={teamRef}>
        <div className="container px-4">
          <motion.div
            initial="hidden"
            animate={teamInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeIn} className="text-3xl font-bold mb-4">
              Our Leadership Team
            </motion.h2>
            <motion.p variants={fadeIn} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Meet the experts behind MarineTech's innovative ship maintenance solutions
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={teamInView ? "visible" : "hidden"}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                name: "Captain James Wilson",
                role: "Founder & CEO",
                bio: "With over 30 years of maritime experience, Capt. Wilson founded MarineTech to revolutionize ship maintenance.",
              },
              {
                name: "Dr. Sarah Chen",
                role: "Chief Technology Officer",
                bio: "Dr. Chen leads our AI development team, creating cutting-edge diagnostic tools for maritime applications.",
              },
              {
                name: "Michael Rodriguez",
                role: "Head of Operations",
                bio: "Michael ensures our maintenance teams deliver exceptional service across global operations.",
              },
              {
                name: "Emma Thompson",
                role: "Chief Engineer",
                bio: "Emma brings 20 years of engineering expertise to oversee all technical aspects of our maintenance services.",
              },
              {
                name: "Robert Nakamura",
                role: "Client Relations Director",
                bio: "Robert works closely with our clients to ensure their maintenance needs are met with precision.",
              },
              {
                name: "Olivia Patel",
                role: "Innovation Lead",
                bio: "Olivia drives the development of new maintenance technologies and methodologies.",
              },
            ].map((member, index) => (
              <motion.div key={index} variants={fadeIn} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                <Card className="h-full transition-all hover:shadow-md overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="relative h-64 overflow-hidden">
                      <Image
                        src={`/placeholder.svg?height=400&width=400&text=${index + 1}`}
                        alt={member.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-6 w-full">
                        <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                        <p className="text-primary font-medium mb-3">{member.role}</p>
                        <p className="text-white/80 text-sm">{member.bio}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </MainLayout>
  )
}
