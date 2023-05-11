const { Op } = require("sequelize")
const { Category, Course, InstructorDetail, StudentDetail, User, StudentCourse } = require("../models")
const bcrypt = require("bcryptjs")
const validation = require("../helpers/validation")

class Controller {
  static home(req, res) {
    const { studentId, instructorId } = req.params
    res.render("home", { studentId, instructorId })
  }

  static loginGet(req, res) {
    const { err } = req.query
    const { studentId, instructorId } = req.params
    res.render("auth-pages/login", { err, studentId, instructorId })

  }
  static loginPost(req, res) {
    const { email, password } = req.body
    const session = req.session
    const options = {
      where: {
        email
      },
      include: [StudentDetail, InstructorDetail]
    }
    const invalidMsg = "Your username / password invalid"
    User.findOne(options)
      .then(user => {
        const valid = bcrypt.compareSync(password, user.password)
        if (!valid) {
          return res.redirect(`/login?err=${invalidMsg}`)
        }
        const role = user.role.toLowerCase()
        const roleId = user[`${user.role}Detail`].id
        session[`${role}Id`] = roleId
        res.redirect(`/${role}/${roleId}`)
      })
      .catch(err => {
        res.redirect(`/login?err=${invalidMsg}`)
      })
  }

  static registerGet(req, res) {
    const query = req.query
    const { studentId, instructorId } = req.params
    res.render("auth-pages/register-student", { err: query, studentId, instructorId })
  }

  static registerPost(req, res) {
    let { email, password, name, gender, bio } = req.body
    const validate = validation({ email, password, name, gender, bio })
    if (validate.status === true) {
      return res.redirect(`/register?${validate.err}`)
    }

    let userId
    User.create({ email, password })
      .then(user => {
        userId = user.id
        return StudentDetail.create({ UserId: userId, name, gender, bio })
      })
      .then(_ => {
        res.redirect("/login")
      })
      .catch(err => {
        // res.send(err)
        if (err.name === "SequelizeValidationError") {
          res.redirect(`/register?${err.errList}`)
        } else {
          res.send(err)
        }
      })
  }

  static studentHome(req, res) {
    const { studentId, instructorId } = req.params
    const { search } = req.query
    let studentData
    let ownedCourse = []
    const studentOptions = {
      include: {
        model: Course
      }
    }
    StudentDetail.findByPk(studentId, studentOptions)
      .then(student => {
        studentData = student
        student.Courses.forEach(el => {
          ownedCourse.push(el.id)
        })
        // res.send(student)
        return Course.notOwnedCourse(ownedCourse, Category, search)
      })
      .then(courses => {
        res.render("student/home", { courses, studentDetail: studentData, studentId, instructorId })
      })
      .catch(err => {
        res.send(err)
      })
  }

  static studentEnroll(req, res) {
    const { studentId, courseId } = req.params
    StudentCourse.create({ StudentDetailId: studentId, CourseId: courseId })
      .then(_ => {
        res.redirect(`/student/${studentId}`)
      })
      .catch(err => {
        res.send(err)
      })
  }

  static studentCourses(req, res) {
    const { studentId, instructorId } = req.params
    const { search } = req.query
    let studentData
    let ownedCourse = []
    const studentOptions = {
      include: {
        model: Course
      }
    }
    StudentDetail.findByPk(studentId, studentOptions)
      .then(student => {
        studentData = student
        student.Courses.forEach(el => {
          ownedCourse.push(el.id)
        })
        return Course.ownedCourse(ownedCourse, Category, search)
      })
      .then(courses => {
        res.render("student/courses", { courses, studentDetail: studentData, studentId, instructorId })
      })
      .catch(err => {
        res.send(err)
      })
  }

  static studentUnEnroll(req, res) {
    const { studentId, courseId } = req.params
    const options = {
      where: {
        StudentDetailId: studentId,
        CourseId: courseId
      }
    }
    StudentCourse.destroy(options)
      .then(_ => {
        res.redirect(`/student/${studentId}/courses`)
      })
      .catch(err => {
        res.send(err)
      })
  }


  static logout(req, res) {
    req.session.destroy(err => {
      if (err) return res.send(err)
      res.redirect("/")
    })
  }

  static showInstructorId(req, res) {
    const { instructorId } = req.params
    // console.log(instructorId, '<<<')
    InstructorDetail.findOne({
      where: {
        id: instructorId
      },
      include: Course
    })
      .then(instructorDetail => {
        // res.send (instructorDetail)
        res.render('instructor', { instructorDetail })
      })
      .catch(err => {
        res.send(err);
      })
  }

  static editInstructor(req, res) {
    const { courseId } = req.params
    Course.findByPk(courseId, {
      include: Category
    })
      .then(course => {
        res.render("instructorEdit", { course })
      })
      .catch(err => {
        res.send(err);
      })
  }

  static instructorSubmit(req, res) {
    const { name, CategoryId, description, duration, poster } = req.body
    const { instructorId, courseId } = req.params
    Course.update({ name, CategoryId, description, duration, poster }, {
      where: {
        id: courseId
      }
    })
      .then(_ => {
        res.redirect(`/instructor/${instructorId}`)
      })
      .catch(err => {
        res.send(err)
      })
  }
}

module.exports = Controller