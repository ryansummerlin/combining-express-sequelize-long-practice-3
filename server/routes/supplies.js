// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();
const sequelize = require('sequelize');

// Import model(s)
const { Supply, Classroom, Student, StudentClassroom } = require('../db/models');
const paginate = require('../utils/pagination');

// List of supplies by category
router.get('/category/:categoryName', async (req, res, next) => {
    let errorResult = { errors: [], count: 0, pageCount: 0 };

    let limit;
    let offset;
    [limit, offset] = paginate(req, errorResult);

    console.log(limit);
    console.log(offset);

    // Phase 1C:
        // Find all supplies by category name
        // Order results by supply's name then handed
        // Return the found supplies as the response body
        const supplies = await Supply.findAll({
            attributes: ['id', 'name', 'category', 'handed', 'classroomId'],
            where: { category: req.params.categoryName },
            order: [
                [Classroom, 'name'],
                ['name'],
                ['handed']
            ],
            include: { model: Classroom, attributes: ['id', 'name']},
            limit: limit,
            offset: offset
        });
    // Phase 8A:
        // Include Classroom in the supplies query results
        // Order nested classroom results by name first then by supply name
    // Included above

    res.json(supplies);
});


// Scissors Supply Calculation - Business Logic Goes Here!
router.get('/scissors/calculate', async (req, res, next) => {
    let result = {};

    // Phase 10A: Current number of scissors in all classrooms
        // result.numRightyScissors should equal the total number of all
            // right-handed "Safety Scissors" currently in all classrooms
        // result.numLeftyScissors should equal the total number of all
            // left-handed "Safety Scissors" currently in all classrooms
        // result.totalNumScissors should equal the total number of all
            // "Safety Scissors" currently in all classrooms, regardless of
            // handed-ness
    const numRightyScissors = await Supply.count({ where: {
        name: 'Safety Scissors',
        handed: 'right'
    }});

    result.numRightyScissors = numRightyScissors;

    const numLeftyScissors = await Supply.count({ where: {
        name: 'Safety Scissors',
        handed: 'left'
    }});

    result.numLeftyScissors = numLeftyScissors;

    const totalNumScissors = await Supply.count({ where: {
        name: 'Safety Scissors'
    }});

    result.totalNumScissors = totalNumScissors;

    // Phase 10B: Total number of right-handed and left-handed students in all
        // classrooms
        // result.numRightHandedStudents should equal the total number of
            // right-handed students in all classrooms
            // Note: This is different from the total amount of students that
                // are right-handed in the database. This is a total of all
                // right-handed students in each classroom combined. Some
                // students are enrolled in multiple classrooms, so if a
                // right-handed student was enrolled in 3 classrooms, that
                // student would contribute to 3 students in the total amount of
                // right-handed students in all classrooms.
        // result.numLeftHandedStudents should equal the total number of
            // left-handed students in all classrooms
    const numRightHandedStudents = await StudentClassroom.count({
        include: { model: Student, attributes: [], where: {
            leftHanded: false
        } }
    });

    result.numRightHandedStudents = numRightHandedStudents;

    const numLeftHandedStudents = await StudentClassroom.count({
        include: { model: Student, attributes: [], where: {
            leftHanded: true
        } }
    });

    result.numLeftHandedStudents = numLeftHandedStudents;

    // Phase 10C: Total number of scissors still needed for all classrooms
        // result.numRightyScissorsStillNeeded should equal the total number
            // of right-handed scissors still needed to be added to all the
            // classrooms
            // Note: This is the number of all right-handed students in all
                // classrooms subtracted by the number of right-handed scissors
                // that all the classrooms already have.
        // result.numLeftyScissorsStillNeeded should equal the total number
            // of left-handed scissors still needed to be added to all the
            // classrooms
    result.numRightyScissorsStillNeeded = numRightHandedStudents - numRightyScissors;

    result.numLeftyScissorsStillNeeded = numLeftHandedStudents - numLeftyScissors;

    res.json(result);
});

// Export class - DO NOT MODIFY
module.exports = router;
