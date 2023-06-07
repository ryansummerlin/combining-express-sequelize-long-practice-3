// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Classroom, Supply, StudentClassroom, Student } = require('../db/models');
const { Op } = require('sequelize');

// List of classrooms
router.get('/', async (req, res, next) => {
    let errorResult = { errors: [], count: 0, pageCount: 0 };

    // Phase 6B: Classroom Search Filters
    /*
        name filter:
            If the name query parameter exists, set the name query
                filter to find a similar match to the name query parameter.
            For example, if name query parameter is 'Ms.', then the
                query should match with classrooms whose name includes 'Ms.'

        studentLimit filter:
            If the studentLimit query parameter includes a comma
                And if the studentLimit query parameter is two numbers separated
                    by a comma, set the studentLimit query filter to be between
                    the first number (min) and the second number (max)
                But if the studentLimit query parameter is NOT two integers
                    separated by a comma, or if min is greater than max, add an
                    error message of 'Student Limit should be two integers:
                    min,max' to errorResult.errors
            If the studentLimit query parameter has no commas
                And if the studentLimit query parameter is a single integer, set
                    the studentLimit query parameter to equal the number
                But if the studentLimit query parameter is NOT an integer, add
                    an error message of 'Student Limit should be a integer' to
                    errorResult.errors
    */
    const where = {};

    if (req.query.name) {
        where.name = { [Op.like]: `%${req.query.name}%`};
    }

    if (req.query.studentLimit) {
        const limits = req.query.studentLimit.split(',').map(str => parseInt(str, 10));
        console.log(limits);
        console.log(limits[0] > limits[1]);

        if (limits.length === 2) {
            let min = limits[0];
            let max = limits[1];
            if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
                errorResult.errors.push({ message: 'Student Limit should be two numbers: min,max'} );
            } else {
                where.studentLimit = { [Op.between]: limits};
            }
        } else if (limits.length === 1) {
            let num = limits[0];
            if (Number.isInteger(num)) {
                where.studentLimit = num;
            } else {
                errorResult.errors.push({ message: 'Student Limit should be an integer'} );
            }
        } else if (limits.length > 2) {
            errorResult.errors.push({ message: 'Student Limit should be two numbers: min,max'} );
        }
    }

    if (errorResult.errors.length > 0) {
        next(errorResult);
    }

    const classrooms = await Classroom.findAll({
        attributes: [ 'id', 'name', 'studentLimit' ],
        where,
        // Phase 1B: Order the Classroom search results
        order: [
            ['name', 'ASC']
        ]
    });

    res.json(classrooms);
});

// Single classroom
router.get('/:id', async (req, res, next) => {
    let classroom = await Classroom.findByPk(req.params.id, {
        attributes: ['id', 'name', 'studentLimit'],
        // Phase 7:
            // Include classroom supplies and order supplies by category then
                // name (both in ascending order)
            // Include students of the classroom and order students by lastName
                // then firstName (both in ascending order)
                // (Optional): No need to include the StudentClassrooms
        include: [{ model: Supply, attributes: ['id', 'name', 'category', 'handed'] },
            { model: Student, attributes: ['id', 'firstName', 'lastName', 'leftHanded'], through: { model: StudentClassroom, attributes: [] } } ],
        order: [
            [Supply, 'category', 'ASC'],
            [Supply, 'name', 'ASC'],
            [Student, 'lastName', 'ASC'],
            [Student, 'firstName', 'ASC']
        ]

    });

    if (!classroom) {
        res.status(404);
        res.send({ message: 'Classroom Not Found' });
    }

    // Phase 5: Supply and Student counts, Overloaded classroom


        // Phase 5A: Find the number of supplies the classroom has and set it as
            // a property of supplyCount on the response
    const supplyCount = await Supply.count({
        where: {
            classRoomId: req.params.id
        }
    });

    classroom.supplyCount = supplyCount;


        // Phase 5B: Find the number of students in the classroom and set it as
            // a property of studentCount on the response
    const studentCount = await StudentClassroom.count({
        where: {
            classroomId: req.params.id
        }
    });

    classroom.studentCount = studentCount;


        // Phase 5C: Calculate if the classroom is overloaded by comparing the
            // studentLimit of the classroom to the number of students in the
            // classroom

    if (classroom.studentCount > classroom.studentLimit) {
        classroom.overloaded = true;
    } else {
        classroom.overloaded = false;
    }

        // Optional Phase 5D: Calculate the average grade of the classroom

    let gradeSum = await StudentClassroom.sum('grade', {
        where: {
            classroomId: req.params.id
        }
    });

    classroom.avgGrade = gradeSum / classroom.studentCount;


    res.json(classroom);
});

// Export class - DO NOT MODIFY
module.exports = router;
