// ─── repairAll ────────────────────────────────────────────────────────────────
const repairAll = async (req, res) => {
  try {
    const report = await ticketService.repairDatabase()
    res.json({
      status: 'success',
      message: 'Base de datos reparada con éxito.',
      details: report
    })
  } catch (err) {
    console.error('Error reparando base de datos:', err)
    res.status(500).json({ status: 'error', message: 'Error interno del servidor al reparar la base de datos' })
  }
}