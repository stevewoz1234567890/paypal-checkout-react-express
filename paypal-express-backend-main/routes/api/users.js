const express = require('express');
const router = express.Router();

const auth = require('../../middleware/auth');
const User = require('../../models/User');

// @route    GET api/user
// @desc     Get user by token
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    Post api/user/updatebalance
// @desc     Update balance
// @access   Private
router.post('/updatebalance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    const { change_amount, paymentmethod } = req.body;
    let balance = 0;
    if (paymentmethod === '_deposit') {
      balance = user.balance + change_amount;
    } else if (paymentmethod === '_send') {
      if (user.balance < change_amount) {
        return res
          .status(400)
          .json({ msg: 'Your balance is not enough.' });
      }
      balance = user.balance - change_amount;

      const { recipent_name } = req.body;
      const recipent_user = await User.findOne({ name: recipent_name }).select('-password');
      if (!recipent_user) {
        return res.status(404).json({ errors: [{ msg: `There is no Such User: ${recipent_name}` }] });
      }
      recipent_user.balance += change_amount;
      recipent_user.save();
    } else if (paymentmethod === '_withdraw') {
      if (user.balance < change_amount) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Your balance is not enough.' }] });
      }
      balance = user.balance - change_amount;
    }
    let updated_user = await User.findOneAndUpdate({ _id: req.user.id }, { $set: { balance: balance } }, { returnDocument: "after" }).select('-password');
    res.json(updated_user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
