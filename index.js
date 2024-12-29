const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require("mongoose");
require('dotenv').config()

mongoose.connect(process.env.DB_URI, { useUnifiedTopology: true, useNewUrlParser: true });

const { Schema } = mongoose;

const ExerciseSchema = new Schema({
	userId: { type: "string", required: true },
	description: { type: "string" },
	duration: { type: "number" },
	date: { type: "Date" },
});

const UserSchema = new Schema({
	username: { type: "string" },
});

const User = mongoose.model("User", UserSchema);
const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use((req, res, next) => {
  console.log("method: " + req.method + "  |  path: " + req.path + "  |  IP - " + req.ip);
  next();
});

app.post("/api/users", (req, res) => {
	console.log("req.body", req.body);
	const user = new User({
		username: req.body.username,
	});

  user.save((err, data) => {
		if (err) return done(err);
		res.json({ username: data.username, _id: data.id });
  });
});

app.get("/api/users", (req, res) => {
  User.find({}, (err,data) => {
		if (err) return done(err);
    res.json(data);
  });
})

app.post("/api/users/:id/exercises", (req, res) => {
	console.log("req.body", req.body);
	console.log("req.params", req.params);

	const id = req.params.id;
	const { description, duration, date } = req.body;

	User.findById(id, (err, userData) => {
		if (err) return done(err);

		const newExercise = new Exercise({
			userId: id,
			description,
			duration,
			date: date ? new Date(date) : new Date(),
		});

		newExercise.save((err, data) => {
			if (err) return done(err);
			const { description, duration, date } = data;
			
			res.json({
				username: userData.username,
				description,
				duration,
				date: date.toDateString(),
				_id: userData.id,
			});
		});
	});
});

app.get("/api/users/:_id/logs", (req, res) => {
	const { _id } = req.params;
	const { from, to, limit } = req.query;

	User.findById(_id, (err, user) => {
		if (err) return done(err);

		Exercise.find({ userId: _id }, (err, exercises) => {
			if (err) return done(err);

			let log = exercises.map((exercise) => {
				return {
					description: exercise.description,
					duration: exercise.duration,
					date: exercise.date.toDateString(),
				};
			});

			if (from) {
				log = log.filter((exercise) => new Date(exercise.date) > new Date(from));
			}

			if (to) {
				log = log.filter((exercise) => new Date(exercise.date) < new Date(to));
			}

			if (limit) {
				log = log.slice(0, limit);
			}

			res.json({
				_id: user.id,
				username: user.username,
				count: log.length,
				log,
			});
		});
	});
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
