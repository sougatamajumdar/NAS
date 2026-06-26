import { useState } from "react"

import { Navigate } from "react-router-dom"

import {
  motion
} from "framer-motion"

import {
  Card,
  CardContent
} from "@/components/ui/card"

import {
  Input
} from "@/components/ui/input"

import {
  Button
} from "@/components/ui/button"

import {
  HardDrive,
  ShieldCheck,
  Cloud,
  FolderKanban,
  ArrowRight,
  LockKeyhole,
  User2,
  EyeOff,
  Eye
} from "lucide-react"

import {
  useAuthStore
} from "@/store/authStore"

export default function LoginPage() {

  const {
    login,
    user,
    loading
  } = useAuthStore()

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  const [error, setError] = useState("")

  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {

    e.preventDefault()

    setError("")

    const result =
      await login(formData)

    if (!result.success) {

      setError(
        result.error
          ?.non_field_errors?.[0]
        ||
        "Login failed"
      )
    }
  }

  if (user) {

    return (
      <Navigate
        to="/drive"
        replace
      />
    )
  }

  return (

    <div
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-background
        text-foreground
        flex
        items-center
        justify-center
        px-4
      "
    >

      {/* BACKGROUND */}

      <div
        className="
          absolute
          inset-0
          app-gradient
        "
      />

      <div
        className="
          absolute
          top-0
          left-0
          h-[500px]
          w-[500px]
          rounded-full
          bg-blue-500/10
          blur-3xl
        "
      />

      <div
        className="
          absolute
          bottom-0
          right-0
          h-[500px]
          w-[500px]
          rounded-full
          bg-purple-500/10
          blur-3xl
        "
      />

      {/* CONTENT */}

      <motion.div
        initial={{
          opacity: 0,
          y: 40
        }}

        animate={{
          opacity: 1,
          y: 0
        }}

        transition={{
          duration: 0.5
        }}

        className="
          relative
          z-10
          w-full
          max-w-6xl
          grid
          lg:grid-cols-2
          gap-8
          items-center
        "
      >

        {/* LEFT SIDE */}

        <div
          className="
            hidden
            lg:flex
            flex-col
            justify-center
            px-8
          "
        >

          <div
            className="
              inline-flex
              items-center
              gap-3
              mb-6
            "
          >

            <div
              className="
                h-16
                w-16
                rounded-3xl
                bg-primary
                text-white
                flex
                items-center
                justify-center
                shadow-2xl
              "
            >

              <HardDrive size={30} />

            </div>

            <div>

              <h1
                className="
                  text-5xl
                  font-black
                  tracking-tight
                "
              >
                NAS OS
              </h1>

              <p
                className="
                  text-muted-foreground
                  mt-1
                "
              >
                Smart Personal Cloud
              </p>

            </div>

          </div>

          <p
            className="
              text-lg
              leading-relaxed
              text-muted-foreground
              max-w-xl
            "
          >

            Modern self-hosted storage
            platform with secure file
            management, real-time sync,
            smart previews, storage
            analytics, and multi-device
            access.

          </p>

          {/* FEATURES */}

          <div
            className="
              mt-10
              grid
              gap-4
            "
          >

            <FeatureCard
              icon={Cloud}
              title="Private Cloud Storage"
              desc="Access files anywhere securely."
            />

            <FeatureCard
              icon={ShieldCheck}
              title="Secure Disk Validation"
              desc="Real-time storage safety checks."
            />

            <FeatureCard
              icon={FolderKanban}
              title="Smart File Management"
              desc="Preview, share, upload, and organize."
            />

          </div>

        </div>

        {/* RIGHT SIDE */}

        <Card
          className="
            glass
            border-white/10
            shadow-2xl
            rounded-3xl
            overflow-hidden
          "
        >

          <CardContent
            className="
              p-8
              md:p-10
            "
          >

            {/* MOBILE LOGO */}

            <div
              className="
                lg:hidden
                flex
                flex-col
                items-center
                mb-8
              "
            >

              <div
                className="
                  h-16
                  w-16
                  rounded-3xl
                  bg-primary
                  text-white
                  flex
                  items-center
                  justify-center
                  mb-4
                "
              >

                <HardDrive size={28} />

              </div>

              <h1
                className="
                  text-3xl
                  font-bold
                "
              >
                NAS OS
              </h1>

            </div>

            {/* TITLE */}

            <div className="mb-8">

              <h2
                className="
                  text-3xl
                  font-bold
                  tracking-tight
                "
              >
                Welcome Back
              </h2>

              <p
                className="
                  mt-2
                  text-muted-foreground
                "
              >
                Sign in to access your
                personal storage system.
              </p>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* USERNAME */}

              <div className="space-y-2">

                <label
                  className="
                    text-sm
                    font-medium
                  "
                >
                  Username
                </label>

                <div className="relative">

                  <User2
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      h-4
                      w-4
                      text-muted-foreground
                    "
                  />

                  <Input
                    placeholder="Enter username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="
                      pl-10
                      h-12
                      bg-white/5
                      border-white/10
                      rounded-2xl
                    "
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="space-y-2">

                <label
                  className="
                    text-sm
                    font-medium
                  "
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      h-4
                      w-4
                      text-muted-foreground
                    "
                  />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="
                      pl-10
                      h-12
                      bg-white/5
                      border-white/10
                      rounded-2xl
                    "
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="
                      absolute
                      right-2
                      top-1/2
                      -translate-y-1/2
                      h-8
                      w-8
                      hover:bg-transparent
                    "
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>

              </div>

              {/* ERROR */}

              {error && (

                <div
                  className="
                    text-sm
                    text-red-400
                    bg-red-500/10
                    border
                    border-red-500/20
                    rounded-2xl
                    px-4
                    py-3
                  "
                >
                  {error}
                </div>
              )}

              {/* BUTTON */}

              <Button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  h-12
                  rounded-2xl
                  text-base
                  font-medium
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >

                  {loading
                    ? "Signing in..."
                    : "Enter NAS"
                  }

                  {!loading && (
                    <ArrowRight
                      size={18}
                    />
                  )}

                </div>

              </Button>

            </form>

          </CardContent>

        </Card>

      </motion.div>

    </div>
  )
}

/* ===================================== */

function FeatureCard({
  icon: Icon,
  title,
  desc
}) {

  return (

    <div
      className="
        glass
        border
        border-white/10
        rounded-2xl
        p-4
        flex
        items-start
        gap-4
      "
    >

      <div
        className="
          h-12
          w-12
          rounded-2xl
          bg-primary/20
          flex
          items-center
          justify-center
          shrink-0
        "
      >

        <Icon className="h-6 w-6" />

      </div>

      <div>

        <h3
          className="
            font-semibold
            mb-1
          "
        >
          {title}
        </h3>

        <p
          className="
            text-sm
            text-muted-foreground
          "
        >
          {desc}
        </p>

      </div>

    </div>
  )
}