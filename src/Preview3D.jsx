import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function Preview3D({ gcodeLines }) {
  const mountRef = useRef(null)
  const stateRef = useRef({ rotation: { x: 0.4, y: 0 }, zoom: 1, isDragging: false, lastMouse: { x: 0, y: 0 } })

  useEffect(() => {
    const el = mountRef.current
    if (!el || !gcodeLines?.length) return

    // ── Scene ──
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0f)
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.004)

    const w = el.clientWidth
    const h = el.clientHeight
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    el.appendChild(renderer.domElement)

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0x223366, 1.0))
    const key = new THREE.DirectionalLight(0x88ccff, 1.5)
    key.position.set(100, 200, 100)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x2244aa, 0.5)
    fill.position.set(-100, 50, -100)
    scene.add(fill)
    const rim = new THREE.PointLight(0x44aaff, 0.8, 500)
    rim.position.set(0, 200, -150)
    scene.add(rim)

    // ── Grid ──
    const grid = new THREE.GridHelper(300, 30, 0x111833, 0x0d1020)
    scene.add(grid)

    // ── Parse G-code ──
    const points = []
    let minY = Infinity, maxY = -Infinity

    for (const line of gcodeLines) {
      if (!line.startsWith('G1')) continue
      const xm = line.match(/X([-\d.]+)/)
      const ym = line.match(/Y([-\d.]+)/)
      const zm = line.match(/Z([-\d.]+)/)
      const em = line.match(/E([-\d.]+)/)
      if (xm && ym && zm && em) {
        const py = parseFloat(zm[1])
        minY = Math.min(minY, py)
        maxY = Math.max(maxY, py)
        points.push(new THREE.Vector3(parseFloat(xm[1]), py, parseFloat(ym[1])))
      }
    }

    if (points.length > 1) {
      // Downsample if too many points for performance
      const MAX_POINTS = 30000
      const sampled = points.length > MAX_POINTS
        ? points.filter((_, i) => i % Math.ceil(points.length / MAX_POINTS) === 0)
        : points

      const geometry = new THREE.BufferGeometry().setFromPoints(sampled)

      // Height-based color gradient
      const colors = []
      for (const p of sampled) {
        const t = (p.y - minY) / (maxY - minY || 1)
        const c = new THREE.Color()
        // Deep blue → cyan → white gradient
        c.setHSL(0.58 - t * 0.15, 0.85 - t * 0.3, 0.25 + t * 0.55)
        colors.push(c.r, c.g, c.b)
      }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

      const mat = new THREE.LineBasicMaterial({ vertexColors: true })
      scene.add(new THREE.Line(geometry, mat))

      // Center camera on object
      const centerY = (minY + maxY) / 2
      camera.lookAt(0, centerY, 0)
    }

    // ── Animation ──
    let frameId
    const state = stateRef.current

    const animate = () => {
      frameId = requestAnimationFrame(animate)
      const centerY = (minY + maxY) / 2 || 50
      const dist = 200 * state.zoom
      camera.position.set(
        Math.sin(state.rotation.y) * dist,
        centerY + state.rotation.x * (maxY - minY || 100) * 0.8,
        Math.cos(state.rotation.y) * dist
      )
      camera.lookAt(0, centerY, 0)
      renderer.render(scene, camera)
    }
    animate()

    // ── Mouse / Touch Controls ──
    const onDown = (e) => {
      state.isDragging = true
      state.lastMouse = { x: e.clientX ?? e.touches?.[0]?.clientX, y: e.clientY ?? e.touches?.[0]?.clientY }
      el.style.cursor = 'grabbing'
    }
    const onUp = () => { state.isDragging = false; el.style.cursor = 'grab' }
    const onMove = (e) => {
      if (!state.isDragging) return
      const cx = e.clientX ?? e.touches?.[0]?.clientX
      const cy = e.clientY ?? e.touches?.[0]?.clientY
      state.rotation.y += (cx - state.lastMouse.x) * 0.01
      state.rotation.x = Math.max(-1.2, Math.min(1.2, state.rotation.x - (cy - state.lastMouse.y) * 0.005))
      state.lastMouse = { x: cx, y: cy }
    }
    const onWheel = (e) => {
      state.zoom = Math.max(0.3, Math.min(4, state.zoom + e.deltaY * 0.001))
    }

    el.addEventListener('mousedown', onDown)
    el.addEventListener('touchstart', onDown)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove)
    el.addEventListener('wheel', onWheel, { passive: true })

    // ── Resize ──
    const onResize = () => {
      const nw = el.clientWidth, nh = el.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(el)

    return () => {
      cancelAnimationFrame(frameId)
      ro.disconnect()
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
      el.removeEventListener('mousedown', onDown)
      el.removeEventListener('touchstart', onDown)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gcodeLines])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', cursor: 'grab', borderRadius: 12, overflow: 'hidden' }}
    />
  )
}
