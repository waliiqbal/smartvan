/* eslint-disable prettier/prettier */
import { 
  Body, 
  Controller, 
  Post, 
  Req, 
  Get,
  BadRequestException,
  Query,
  Param

  

} from '@nestjs/common';


import { alertService } from './alert.service';
import { AddAlertDto } from './dto/addAlertdto';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';

@Controller('alert')
export class AlertController {
  constructor(private readonly AlertService: alertService) {}


  @UseGuards(AuthGuard('jwt'))
  @Post('addAlert')
  async addAlert(@Body() addAlertDto: AddAlertDto, @Req() req: any) {
    const adminId = req.user.userId
    return this.AlertService.addAlert(addAlertDto, adminId);
  
  }

   @UseGuards(AuthGuard('jwt')) // JWT protection
  @Get('getAlert')
  async getAlert(
    @Req() req: any, // JWT se user info aayega
    @Query('page') page: string,
    @Query('limit') limit: string
  ) {
    // JWT se adminId nikal lo (agar zarurat ho)
    const adminId = req.user.userId;

    if (!adminId) {
      throw new BadRequestException('Admin not found in token');
    }

    // pagination values parse karo
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;

    // service function call with pagination
    return this.AlertService.getAlerts(adminId, pageNumber, limitNumber);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('getAlertById/:alertId')
  async getAlertById(@Param('alertId') alertId: string, @Req() req: any) {
    const adminId = req.user.userId; // JWT se adminId
    return this.AlertService.getAlertById(adminId, alertId);
  }

@UseGuards(AuthGuard('jwt'))
@Post('editAlert')
async editAlert(@Req() req: any, @Body() body: any) {
  const adminId = req.user.userId; // JWT se admin ID
  const { alertId, ...updateData } = body; // body se alertId alag kar liya

  if (!alertId) {
    throw new BadRequestException('alertId is required');
  }

  return this.AlertService.editAlert(adminId, alertId, updateData);
}
@UseGuards(AuthGuard('jwt'))
@Post('deleteAlert')
async deleteAlert(@Req() req: any, @Body('alertId') alertId: string) {
  const adminId = req.user.userId; 
  return this.AlertService.deleteAlert(adminId, alertId);
}


  @UseGuards(AuthGuard('jwt'))
    @Get('getNotificationByParent')
  async getKids(@Req() req: any) {
    const userId = req.user.userId; // 👈 token se extract hua
    return this.AlertService.getAlertsForParent(userId);
  }

  @UseGuards(AuthGuard('jwt'))
@Get('getNotificationForDriver')
async getAlertsForDriver(@Req() req: any) {
  const  userId  = req.user.userId; 

  return this.AlertService.getAlertsForDriver(userId);
}


 @UseGuards(AuthGuard('jwt'))
  @Get('getDriverNotificationByParent')
  async getDriverNotifications(@Req() req: any) {
    const parentId = req.user.userId; // JWT payload me parentId
    return this.AlertService.getDriverNotificationsByParent(parentId);
  }

  @Get('termsOfServices')
async getTermsAndConditions(@Req() req: any) {
  return {
    success: true,
    title: 'Terms of Service',
    html: `
      <p>
        Welcome to Smart Van!
      </p>

      <p>
        These terms and conditions outline the rules and regulations for the use
        of Smart Van's Website, located at Website.com.
      </p>

      <p>
        By accessing this website we assume you accept these terms and conditions.
        Do not continue to use Smart Van if you do not agree to take all of the
        terms and conditions stated on this page.
      </p>

      <p>
        The following terminology applies to these Terms and Conditions, Privacy
        Statement and Disclaimer Notice and all Agreements: "Client", "You" and
        "Your" refers to you, the person log on this website and compliant to the
        Company’s terms and conditions. "The Company", "Ourselves", "We", "Our"
        and "Us", refers to our Company. "Party", "Parties", or "Us", refers to
        both the Client and ourselves.
      </p>

      <p>
        All terms refer to the offer, acceptance and consideration of payment
        necessary to undertake the process of our assistance to the Client in
        the most appropriate manner for the express purpose of meeting the
        Client’s needs in respect of provision of the Company’s stated services,
        in accordance with and subject to, prevailing law of Netherlands.
      </p>

      <p>
        Any use of the above terminology or other words in the singular, plural,
        capitalization and/or he/she or they, are taken as interchangeable and
        therefore as referring to same.
      </p>

      <h3>Cookies</h3>
      <p>
        We employ the use of cookies. By accessing Smart Van, you agreed to use
        cookies in agreement with the Smart Van's Privacy Policy.
      </p>
    `,
  };
}

@Get('privacy-policy')
async getPrivacyPolicy(@Req() req: any) {
  return {
    success: true,
    title: 'Privacy Policy',
    html: `
      <p>
        At Smart Van, accessible at meem.com, one of our main priorities is the
        privacy of our visitors. This Privacy Policy document contains types of
        information that is collected and recorded by Smart Van and how we use it.
      </p>

      <p>
        If you have additional questions or require more information about our
        Privacy Policy, do not hesitate to contact us through email at
        Email@Website.com.
      </p>

      <p>
        This privacy policy applies only to our online activities and is valid
        for visitors to our website with regards to the information that they
        shared and/or collect in Smart Van. This policy is not applicable to any
        information collected offline or via channels other than this website.
      </p>

      <h3>Consent</h3>
      <p>
        By using our website, you hereby consent to our Privacy Policy and agree
        to its terms.
      </p>

      <h3>Information we collect</h3>
      <p>
        The personal information that you are asked to provide, and the reasons
        why you are asked to provide it, will be made clear to you at the point
        we ask you to provide your personal information
        </p>
        `,
  };
}


}

