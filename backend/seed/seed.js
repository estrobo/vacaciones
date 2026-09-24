// Script para poblar la base de datos con datos iniciales
const { sequelize } = require('../config/database');
const Usuario = require('../models/Usuario');
const ConfiguracionDias = require('../models/ConfiguracionDias');
const { calcularAntiguedad, getCortesAnuales, formatDate } = require('../services/vacationService');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a BD establecida');
    // En SQLite, evita 'alter: true' para no romper con backups/constraints.
await sequelize.sync({ force: false });
    console.log('Tablas sincronizadas');

    // Crear administrador inicial
    const adminEmail = 'admin@empresa.com';
    let admin = await Usuario.findOne({ where: { email: adminEmail } });
    if (!admin) {
      const hashed = await bcrypt.hash('admin123', 10);
      admin = await Usuario.create({
        nombre: 'Administrador',
        email: adminEmail,
        password: hashed,
        rol: 'administrador',
        secciones: ['todas'],
        numero_trabajador: 'A001',
        fecha_ingreso: '2020-01-01'
      });
      console.log('Admin creado: admin@empresa.com / admin123');
    }

    // Configuración inicial de días por antigüedad (LFT México - derogada pero de uso común)
    // La nueva LFT (2023) incrementa días, aquí usamos una configuración moderna
    const configs = [
      { antiguedad: 1, dias_asignados: 12 },
      { antiguedad: 2, dias_asignados: 14 },
      { antiguedad: 3, dias_asignados: 16 },
      { antiguedad: 4, dias_asignados: 18 },
      { antiguedad: 5, dias_asignados: 20 },
      { antiguedad: 6, dias_asignados: 22 },
      { antiguedad: 7, dias_asignados: 24 },
      { antiguedad: 8, dias_asignados: 26 },
      { antiguedad: 9, dias_asignados: 28 },
      { antiguedad: 10, dias_asignados: 30 },
      { antiguedad: 11, dias_asignados: 32 },
      { antiguedad: 12, dias_asignados: 34 },
      { antiguedad: 13, dias_asignados: 36 },
      { antiguedad: 14, dias_asignados: 38 },
      { antiguedad: 15, dias_asignados: 40 },
      { antiguedad: 16, dias_asignados: 41 },
      { antiguedad: 17, dias_asignados: 42 },
      { antiguedad: 18, dias_asignados: 43 },
      { antiguedad: 19, dias_asignados: 44 },
      { antiguedad: 20, dias_asignados: 45 }
    ];

    for (const c of configs) {
      const existe = await ConfiguracionDias.findOne({ where: { antiguedad: c.antiguedad } });
      if (!existe) {
        await ConfiguracionDias.create(c);
      }
    }
    console.log('Configuración de días cargada');

    console.log('Seed completado correctamente');
    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err);
    process.exit(1);
  }
}

seed();
