const mongoose = require('mongoose');
const { Schema } = mongoose;

// Định nghĩa Schemas
const studentSchema = new Schema({
    name: { type: String, required: true },
    courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }]
});

const courseSchema = new Schema({
    title: { type: String, required: true },
    students: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    maxStudents: { type: Number, required: true },
    availableSlots: { type: Number, required: true }
});

// Tạo Models
const Student = mongoose.model('Student', studentSchema);
const Course = mongoose.model('Course', courseSchema);

// Hàm Đăng ký khóa học (Enroll Course)
async function enrollCourse(studentId, courseId) {
    try {
        const student = await Student.findById(studentId);
        const course = await Course.findById(courseId);

        if (!student || !course) {
            throw new Error('Không tìm thấy Sinh viên hoặc Khóa học.');
        }

        // Kiểm tra xem sinh viên đã đăng ký chưa
        if (student.courses.includes(courseId)) {
            throw new Error('Sinh viên đã đăng ký khóa học này.');
        }

        // Kiểm tra xem khóa học còn chỗ trống không
        if (course.availableSlots <= 0) {
            throw new Error('Khóa học đã hết chỗ (availableSlots = 0).');
        }

        // Cập nhật dữ liệu
        student.courses.push(courseId);
        course.students.push(studentId);
        course.availableSlots -= 1;

        // Lưu thay đổi đồng thời
        await Promise.all([student.save(), course.save()]);
        
        console.log(`Đăng ký thành công! Sinh viên ${student.name} đã tham gia ${course.title}.`);
    } catch (error) {
        console.error('Lỗi đăng ký khóa học:', error.message);
    }
}

// Hàm Hủy đăng ký khóa học (Drop Course)
async function dropCourse(studentId, courseId) {
    try {
        const student = await Student.findById(studentId);
        const course = await Course.findById(courseId);

        if (!student || !course) {
            throw new Error('Không tìm thấy Sinh viên hoặc Khóa học.');
        }

        // Kiểm tra xem sinh viên có trong danh sách khóa học không
        if (!student.courses.includes(courseId)) {
            throw new Error('Sinh viên chưa đăng ký khóa học này nên không thể hủy.');
        }

        // Xóa ID khỏi mảng và hoàn lại 1 chỗ trống
        student.courses.pull(courseId);
        course.students.pull(studentId);
        
        // Đảm bảo số lượng availableSlots không vượt quá maxStudents
        if (course.availableSlots < course.maxStudents) {
            course.availableSlots += 1;
        }

        // Lưu thay đổi đồng thời
        await Promise.all([student.save(), course.save()]);
        
        console.log(`Hủy thành công! Sinh viên ${student.name} đã rời khỏi ${course.title}.`);
    } catch (error) {
        console.error('Lỗi hủy khóa học:', error.message);
    }
}

// Phần Chạy Thử nghiệm (Test Execution)
async function runTest() {
    // Thay đổi chuỗi kết nối theo CSDL của bạn (VD: mongodb://localhost:27017/university_db)
    await mongoose.connect('mongodb://localhost:27017/university_db');
    console.log('Đã kết nối tới MongoDB!');

    // Xóa dữ liệu cũ để test
    await Student.deleteMany({});
    await Course.deleteMany({});

    // Tạo dữ liệu mẫu
    const newStudent = new Student({ name: 'Nguyễn Văn A' });
    const newCourse = new Course({ 
        title: 'Lập trình Web Backend', 
        maxStudents: 30, 
        availableSlots: 30 
    });

    await newStudent.save();
    await newCourse.save();

    console.log('-Thử nghiệm Đăng ký (Enroll)');
    await enrollCourse(newStudent._id, newCourse._id);

    console.log('-Thử nghiệm Đăng ký lại (Sẽ báo lỗi)');
    await enrollCourse(newStudent._id, newCourse._id);

    console.log('-Thử nghiệm Hủy khóa học (Drop)');
    await dropCourse(newStudent._id, newCourse._id);

    // Đóng kết nối
    mongoose.connection.close();
}

// Chạy script kiểm tra nếu gọi trực tiếp
if (require.main === module) {
    runTest();
}