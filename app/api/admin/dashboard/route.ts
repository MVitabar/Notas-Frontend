import { NextResponse } from "next/server"
import { api } from "@/lib/api"

interface ActivityItem {
  action: string;
  details: string;
  date: string;
}

export async function GET() {
  try {
    // Get counts
    const [
      teachersRes,
      studentsRes,
      classesRes,
      activeClassesRes
    ] = await Promise.all([
      api.get('/teachers/count'),
      api.get('/students/count'),
      api.get('/classes/count'),
      api.get('/classes/count?status=active')
    ]);

    const totalTeachers = teachersRes.data?.count || 0;
    const totalStudents = studentsRes.data?.count || 0;
    const totalClasses = classesRes.data?.count || 0;
    const activeClasses = activeClassesRes.data?.count || 0;

    // Get distinct subjects and grades counts
    const [subjectsRes, gradesRes] = await Promise.all([
      api.get('/subjects/count'),
      api.get('/grades/count')
    ]);

    const totalSubjects = subjectsRes.data?.count || 0;
    const totalGrades = gradesRes.data?.count || 0;

    // Get recent activity
    const [recentTeachersRes, recentClassesRes, recentStudentsRes] = await Promise.all([
      api.get('/teachers?limit=1&sort=createdAt:desc'),
      api.get('/classes?limit=1&sort=createdAt:desc'),
      api.get('/students?limit=1&sort=createdAt:desc')
    ]);

    const recentTeachers = recentTeachersRes.data?.data || [];
    const recentClasses = recentClassesRes.data?.data || [];
    const recentStudents = recentStudentsRes.data?.data || [];
    
    // Format recent activity
    const recentActivity: ActivityItem[] = [];
    
    // Add teacher activity if available
    if (recentTeachers.length > 0) {
      const teacher = recentTeachers[0];
      recentActivity.push({
        action: "Nuevo docente registrado",
        details: `${teacher.firstName} ${teacher.lastName}`,
        date: teacher.createdAt || new Date().toISOString()
      });
    }
    
    // Add class activity if available
    if (recentClasses.length > 0) {
      const classItem = recentClasses[0];
      recentActivity.push({
        action: "Nueva clase creada",
        details: classItem.name || 'Nueva clase',
        date: classItem.createdAt || new Date().toISOString()
      });
    }
    
    // Add student activity if available
    if (recentStudents.length > 0) {
      const student = recentStudents[0];
      recentActivity.push({
        action: "Nuevo estudiante registrado",
        details: `${student.firstName} ${student.lastName}`,
        date: student.createdAt || new Date().toISOString()
      });
    }
    
    // Add a sample report
    recentActivity.push({
      action: "Reporte generado",
      details: "Notas del primer bimestre",
      date: new Date().toISOString()
    });

    return NextResponse.json({
      stats: {
        totalTeachers,
        totalStudents,
        totalClasses,
        activeClasses,
        totalSubjects,
        totalGrades,
      },
      recentActivity,
      systemStatus: {
        api: 'connected',
        status: 'operational'
      },
    });
  } catch (error) {
    console.error('Error in dashboard:', error);
    return NextResponse.json(
      { 
        error: 'Error fetching dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
