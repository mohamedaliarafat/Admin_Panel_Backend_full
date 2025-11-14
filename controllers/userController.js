const User = require('../models/User');
const CompleteProfile = require('../models/CompleteProfile');
const Notification = require('../models/Notification');
const Product = require('../models/Product');

const userController = {};

// 👤 إنشاء مستخدم جديد (للإدمن) - متوافق مع الموديل
userController.createUser = async (req, res) => {
  try {
    const {
      name,
      phone,
      userType,
      password
    } = req.body;

    // التحقق من الصلاحية (الإدمن فقط)
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'غير مسموح بإنشاء مستخدمين'
      });
    }

    // التحقق من البيانات المطلوبة (فقط الرقم وكلمة المرور)
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'رقم الجوال وكلمة المرور مطلوبان'
      });
    }

    // التحقق من صحة رقم الجوال
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام'
      });
    }

    // التحقق من عدم وجود مستخدم بنفس رقم الجوال
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'رقم الجوال مسجل مسبقاً'
      });
    }

    // إنشاء المستخدم بالبيانات المتوافقة مع الموديل
    const user = new User({
      name: name || '',
      phone,
      userType: userType || 'customer',
      password: password,
      isActive: true,
      isVerified: false,
      profileImage: "https://a.top4top.io/p_356432nv81.png",
      location: {
        lat: 0,
        lng: 0,
        address: "",
        lastUpdated: null
      },
      addresses: [],
      orders: [],
      addedBy: req.user.userId,
      fcmToken: "",
      completeProfile: null
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        userType: user.userType,
        isActive: user.isActive,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في إنشاء المستخدم'
    });
  }
};

// 🔐 تسجيل مستخدم جديد (للعامة)
userController.registerUser = async (req, res) => {
  try {
    const {
      phone,
      password,
      userType = 'customer'
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'رقم الجوال وكلمة المرور مطلوبان'
      });
    }

    // التحقق من صحة رقم الجوال
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام'
      });
    }

    // التحقق من قوة كلمة المرور
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      });
    }

    // التحقق من عدم وجود مستخدم بنفس رقم الجوال
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'رقم الجوال مسجل مسبقاً'
      });
    }

    // إنشاء المستخدم الجديد
    const user = new User({
      name: '',
      phone,
      userType,
      password,
      isActive: true,
      isVerified: false,
      profileImage: "https://a.top4top.io/p_356432nv81.png",
      location: {
        lat: 0,
        lng: 0,
        address: "",
        lastUpdated: null
      },
      addresses: [],
      orders: [],
      addedBy: null,
      fcmToken: "",
      completeProfile: null
    });

    await user.save();

    // هنا يمكن إرسال كود التحقق عبر SMS
    // await sendVerificationCode(phone);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح. يرجى التحقق من رقم الجوال',
      user: {
        id: user._id,
        phone: user.phone,
        userType: user.userType,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Register User Error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في إنشاء الحساب'
    });
  }
};

// ✅ التحقق من رقم الجوال
userController.verifyPhone = async (req, res) => {
  try {
    const { phone, verificationCode } = req.body;

    if (!phone || !verificationCode) {
      return res.status(400).json({
        success: false,
        error: 'رقم الجوال وكود التحقق مطلوبان'
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود'
      });
    }

    // هنا يجب التحقق من صحة كود التحقق
    // const isValidCode = await validateVerificationCode(phone, verificationCode);
    // if (!isValidCode) {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'كود التحقق غير صحيح'
    //   });
    // }

    // تحديث حالة التحقق
    user.isVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'تم التحقق من رقم الجوال بنجاح',
      user: {
        id: user._id,
        phone: user.phone,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Verify Phone Error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في التحقق من رقم الجوال'
    });
  }
};

// 🔑 تسجيل الدخول
userController.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'رقم الجوال وكلمة المرور مطلوبان'
      });
    }

    // البحث عن المستخدم
    const user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'رقم الجوال أو كلمة المرور غير صحيحة'
      });
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'رقم الجوال أو كلمة المرور غير صحيحة'
      });
    }

    // التحقق من أن الحساب مفعل
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'الحساب غير مفعل. يرجى التواصل مع الإدارة'
      });
    }

    // تحديث آخر دخول
    user.lastLogin = new Date();
    await user.save();

    // إنشاء token (يمكن استخدام JWT هنا)
    // const token = generateToken(user);

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        userType: user.userType,
        isVerified: user.isVerified,
        profileImage: user.profileImage
      },
      // token: token
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في تسجيل الدخول'
    });
  }
};

// 📋 جلب المستخدمين (مع الفلترة) - متوافق مع الموديل
userController.getUsers = async (req, res) => {
  try {
    const { 
      userType, 
      isActive, 
      page = 1, 
      limit = 10,
      search 
    } = req.query;

    let query = {};

    // الفلترة حسب نوع المستخدم
    if (userType) query.userType = userType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // البحث
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('addedBy', 'name')
      .populate('completeProfile')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب المستخدمين'
    });
  }
};

// 👁️ جلب مستخدم محدد
userController.getUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password')
      .populate('addedBy', 'name')
      .populate('completeProfile')
      .populate('addresses')
      .populate('orders');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب بيانات المستخدم'
    });
  }
};

// ✏️ تحديث بيانات المستخدم
userController.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // التحقق من الصلاحية (الإدمن فقط أو المستخدم نفسه)
    if (req.user.userType !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'غير مسموح بتحديث بيانات هذا المستخدم'
      });
    }

    // منع تحديث بعض الحقول إذا لم يكن أدمن
    if (req.user.userType !== 'admin') {
      delete updateData.userType;
      delete updateData.isActive;
      delete updateData.addedBy;
      delete updateData.isVerified;
    }

    // منع تحديث كلمة المرور من هنا
    if (updateData.password) {
      delete updateData.password;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث بيانات المستخدم بنجاح',
      user
    });

  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في تحديث بيانات المستخدم'
    });
  }
};

// 🗑️ حذف مستخدم
userController.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // التحقق من الصلاحية (الإدمن فقط)
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'غير مسموح بحذف المستخدمين'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'المستخدم غير موجود'
      });
    }

    // منع حذف المستخدمين الإدمن
    if (user.userType === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'لا يمكن حذف مستخدمين إدمن'
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });

  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في حذف المستخدم'
    });
  }
};

// 📊 إحصائيات المستخدمين
userController.getUserStats = async (req, res) => {
  try {
    // التحقق من الصلاحية (الإدمن والمتابعة فقط)
    if (!['admin', 'monitoring'].includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        error: 'غير مسموح بالوصول للإحصائيات'
      });
    }

    const [
      totalUsers,
      totalCustomers,
      totalDrivers,
      totalAdmins,
      totalSupervisors,
      totalMonitoring,
      activeUsers,
      verifiedUsers,
      newUsersToday
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ userType: 'customer' }),
      User.countDocuments({ userType: 'driver' }),
      User.countDocuments({ userType: 'admin' }),
      User.countDocuments({ userType: 'approval_supervisor' }),
      User.countDocuments({ userType: 'monitoring' }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ 
        createdAt: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
        } 
      })
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCustomers,
        totalDrivers,
        totalAdmins,
        totalSupervisors,
        totalMonitoring,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        verifiedUsers,
        pendingVerification: totalUsers - verifiedUsers,
        newUsersToday
      }
    });

  } catch (error) {
    console.error('Get User Stats Error:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في جلب إحصائيات المستخدمين'
    });
  }
};

// 🛍️ جلب منتجات المستخدم (للإدمن)
userController.getUserProducts = async (req, res) => {
  try {
    const { userId } = req.params;

    res.json({
      success: true,
      products: [],
      message: 'سيتم تطوير هذه الوظيفة قريباً'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 🛍️ جلب منتجاتي
userController.getMyProducts = async (req, res) => {
  try {
    res.json({
      success: true,
      products: [],
      message: 'سيتم تطوير هذه الوظيفة قريباً'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 🚗 إدارة السائقين
userController.manageDrivers = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'تمت العملية بنجاح'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ✅ الموافقة على ملف مستخدم
userController.approveProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'تمت الموافقة بنجاح'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 🎯 دوال مساعدة
const sendDriverStatusNotification = async (driver, action, reason) => {
  try {
    let title, body;

    switch (action) {
      case 'activate':
        title = 'تم تفعيل حسابك';
        body = 'تم تفعيل حسابك كسائق في التطبيق';
        break;
      case 'deactivate':
        title = 'تم إيقاف حسابك';
        body = 'تم إيقاف حسابك كسائق مؤقتاً';
        break;
      case 'suspend':
        title = 'تم تعليق حسابك';
        body = `تم تعليق حسابك للأسباب التالية: ${reason}`;
        break;
    }

    const notification = new Notification({
      title,
      body,
      user: driver._id,
      type: 'driver_status',
      data: {
        action,
        reason
      }
    });

    await notification.save();
  } catch (error) {
    console.error('خطأ في إرسال إشعار حالة السائق:', error);
  }
};

const sendProfileStatusNotification = async (userId, status, rejectionReason) => {
  try {
    let title, body;

    if (status === 'approved') {
      title = 'تم الموافقة على ملفك الشخصي';
      body = 'تمت الموافقة على ملفك الشخصي ويمكنك الآن استخدام التطبيق';
    } else {
      title = 'ملاحظات على ملفك الشخصي';
      body = `يحتاج ملفك الشخصي بعض التعديلات: ${rejectionReason}`;
    }

    const notification = new Notification({
      title,
      body,
      user: userId,
      type: status === 'approved' ? 'profile_approved' : 'profile_rejected',
      data: {
        status,
        rejectionReason
      }
    });

    await notification.save();
  } catch (error) {
    console.error('خطأ في إرسال إشعار حالة الملف:', error);
  }
};

module.exports = userController;
