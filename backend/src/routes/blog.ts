import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from 'hono/jwt'
import { createBlogInput, updateBlogInput} from '@deepak_singh18/medium-common'

export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string
        JWT_SECRET: string
    },
    Variables: {
        userId: string
    }
}>();


blogRouter.use('/*', async (c, next) => {
    const authHeader = c.req.header("authorization") || "";
    
    try {
        const user = await verify(authHeader, c.env.JWT_SECRET);
        if (user) {
            c.set('userId', String(user.id));
            await next();
        } else {
            c.status(403);
            return c.json({
                msg: "You are not logged in"
            })
        }
    } catch (error) {
        c.status(403);
        return c.json({
            msg: "You are not logged in"
        })
    }
})


blogRouter.post('/', async (c) => {
    const body = await c.req.json();
    const { success } = createBlogInput.safeParse(body);
    if (!success) {
        c.status(411)
        return c.json({
            msg: "Inputs are not correct",
        })
    }

    const authorId = c.get("userId");

    const prisma = await new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const blog = await prisma.blog.create({
            data: {
                title: body.title,
                content: body.content,
                authorId: Number(authorId)
            }
        });

        return c.json({
            blogId: blog.id
        });
    } catch (error) {
        c.status(411)
        return c.json({
            msg: "Error in creating blog"
        });
    }
})

blogRouter.put('/', async (c) => {
    const body = await c.req.json();
    const { success } = updateBlogInput.safeParse(body);
    if (!success) {
        c.status(411)
        return c.json({
            msg: "Inputs are not correct",
        })
    }

    const prisma = await new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const blog = await prisma.blog.update({
            where: {
                id: Number(body.id)
            },
            data: {
                title: body.title,
                content: body.content
            }
        });
        return c.json({
            msg: "Blog updated successfully"
        });
    } catch (error) {
        c.status(411)
        console.log("error", error)
        return c.json({
            msg: "Error in updating blog"
        });
    }
})
  

blogRouter.get('/bulk', async (c) => {
    const prisma = await new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const blogs = await prisma.blog.findMany();
        return c.json({
            blogs: blogs
        });
    } catch (error) {
        c.status(411)
        return c.json({
            msg: "Error while fetching all blogs"
        });
    }
})

blogRouter.get('/:id', async (c) => {
    const id = await c.req.param("id");

    const prisma = await new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const blog = await prisma.blog.findFirst({
            where: {
                id: Number(id)
            }
        });
        return c.json({
            blog: blog
        });
    } catch (error) {
        c.status(411)
        return c.json({
            msg: "Error while fetching this blog"
        })
    }
})
  
