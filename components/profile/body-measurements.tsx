"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Plus, TrendingUp, AlertCircle, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/types/database"

type BodyMeasurement = Database["public"]["Tables"]["body_measurements"]["Row"]

interface BodyMeasurementsProps {
  measurements: BodyMeasurement[]
  userId: string
}

export function BodyMeasurements({ measurements, userId }: BodyMeasurementsProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    recorded_at: new Date().toISOString().split("T")[0],
    weight_kg: "",
    body_fat_percentage: "",
    chest_cm: "",
    waist_cm: "",
    hips_cm: "",
    bicep_left_cm: "",
    bicep_right_cm: "",
    thigh_left_cm: "",
    thigh_right_cm: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const measurementData: any = {
      user_id: userId,
      recorded_at: new Date(formData.recorded_at).toISOString(),
      weight_kg: formData.weight_kg ? Number.parseFloat(formData.weight_kg) : null,
      body_fat_percentage: formData.body_fat_percentage ? Number.parseFloat(formData.body_fat_percentage) : null,
      chest_cm: formData.chest_cm ? Number.parseFloat(formData.chest_cm) : null,
      waist_cm: formData.waist_cm ? Number.parseFloat(formData.waist_cm) : null,
      hips_cm: formData.hips_cm ? Number.parseFloat(formData.hips_cm) : null,
      bicep_left_cm: formData.bicep_left_cm ? Number.parseFloat(formData.bicep_left_cm) : null,
      bicep_right_cm: formData.bicep_right_cm ? Number.parseFloat(formData.bicep_right_cm) : null,
      thigh_left_cm: formData.thigh_left_cm ? Number.parseFloat(formData.thigh_left_cm) : null,
      thigh_right_cm: formData.thigh_right_cm ? Number.parseFloat(formData.thigh_right_cm) : null,
      notes: formData.notes || null,
    }

    const { error: insertError } = await supabase.from("body_measurements").upsert(measurementData)

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setIsDialogOpen(false)
    setFormData({
      recorded_at: new Date().toISOString().split("T")[0],
      weight_kg: "",
      body_fat_percentage: "",
      chest_cm: "",
      waist_cm: "",
      hips_cm: "",
      bicep_left_cm: "",
      bicep_right_cm: "",
      thigh_left_cm: "",
      thigh_right_cm: "",
      notes: "",
    })
    setLoading(false)
    router.refresh()
  }

  // Prepare chart data
  const chartData = measurements
    .slice()
    .reverse()
    .map((m) => ({
      date: new Date(m.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      weight: m.weight_kg,
      bodyFat: m.body_fat_percentage,
      chest: m.chest_cm,
      waist: m.waist_cm,
      hips: m.hips_cm,
    }))
    .filter((d) => d.weight || d.bodyFat || d.chest || d.waist || d.hips)

  const latestMeasurement = measurements[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Body Measurements</h2>
          <p className="text-sm text-muted-foreground">Track your body composition over time</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Measurement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Body Measurement</DialogTitle>
              <DialogDescription>Record your body measurements for tracking progress</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="recorded_at">Date</Label>
                <Input
                  id="recorded_at"
                  type="date"
                  value={formData.recorded_at}
                  onChange={(e) => setFormData({ ...formData, recorded_at: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weight_kg">Weight (kg)</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    placeholder="70.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body_fat_percentage">Body Fat (%)</Label>
                  <Input
                    id="body_fat_percentage"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.body_fat_percentage}
                    onChange={(e) => setFormData({ ...formData, body_fat_percentage: e.target.value })}
                    placeholder="15.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chest_cm">Chest (cm)</Label>
                  <Input
                    id="chest_cm"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.chest_cm}
                    onChange={(e) => setFormData({ ...formData, chest_cm: e.target.value })}
                    placeholder="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waist_cm">Waist (cm)</Label>
                  <Input
                    id="waist_cm"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.waist_cm}
                    onChange={(e) => setFormData({ ...formData, waist_cm: e.target.value })}
                    placeholder="80"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hips_cm">Hips (cm)</Label>
                  <Input
                    id="hips_cm"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.hips_cm}
                    onChange={(e) => setFormData({ ...formData, hips_cm: e.target.value })}
                    placeholder="95"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bicep_left_cm">Left Bicep (cm)</Label>
                  <Input
                    id="bicep_left_cm"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.bicep_left_cm}
                    onChange={(e) => setFormData({ ...formData, bicep_left_cm: e.target.value })}
                    placeholder="35"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bicep_right_cm">Right Bicep (cm)</Label>
                  <Input
                    id="bicep_right_cm"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.bicep_right_cm}
                    onChange={(e) => setFormData({ ...formData, bicep_right_cm: e.target.value })}
                    placeholder="35"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thigh_left_cm">Left Thigh (cm)</Label>
                  <Input
                    id="thigh_left_cm"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.thigh_left_cm}
                    onChange={(e) => setFormData({ ...formData, thigh_left_cm: e.target.value })}
                    placeholder="60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thigh_right_cm">Right Thigh (cm)</Label>
                  <Input
                    id="thigh_right_cm"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.thigh_right_cm}
                    onChange={(e) => setFormData({ ...formData, thigh_right_cm: e.target.value })}
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Measurement"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {latestMeasurement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Latest Measurement
            </CardTitle>
            <CardDescription>
              {new Date(latestMeasurement.recorded_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {latestMeasurement.weight_kg && (
                <div>
                  <div className="text-sm text-muted-foreground">Weight</div>
                  <div className="text-2xl font-bold">{latestMeasurement.weight_kg} kg</div>
                </div>
              )}
              {latestMeasurement.body_fat_percentage && (
                <div>
                  <div className="text-sm text-muted-foreground">Body Fat</div>
                  <div className="text-2xl font-bold">{latestMeasurement.body_fat_percentage}%</div>
                </div>
              )}
              {latestMeasurement.chest_cm && (
                <div>
                  <div className="text-sm text-muted-foreground">Chest</div>
                  <div className="text-2xl font-bold">{latestMeasurement.chest_cm} cm</div>
                </div>
              )}
              {latestMeasurement.waist_cm && (
                <div>
                  <div className="text-sm text-muted-foreground">Waist</div>
                  <div className="text-2xl font-bold">{latestMeasurement.waist_cm} cm</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress Chart
            </CardTitle>
            <CardDescription>Track your measurements over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                {chartData.some((d) => d.weight) && (
                  <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#8884d8" name="Weight (kg)" />
                )}
                {chartData.some((d) => d.bodyFat) && (
                  <Line yAxisId="right" type="monotone" dataKey="bodyFat" stroke="#82ca9d" name="Body Fat (%)" />
                )}
                {chartData.some((d) => d.chest) && (
                  <Line yAxisId="left" type="monotone" dataKey="chest" stroke="#ffc658" name="Chest (cm)" />
                )}
                {chartData.some((d) => d.waist) && (
                  <Line yAxisId="left" type="monotone" dataKey="waist" stroke="#ff7300" name="Waist (cm)" />
                )}
                {chartData.some((d) => d.hips) && (
                  <Line yAxisId="left" type="monotone" dataKey="hips" stroke="#8dd1e1" name="Hips (cm)" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {measurements.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No measurements recorded yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Add your first measurement to start tracking!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
